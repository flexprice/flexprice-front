/**
 * Resolves `text-*` tokens against the nearest ANCESTOR `bg-*` token, using the TypeScript parser.
 *
 * The same-element check that came first only sees pairs written in one className. That is the
 * minority case: far more often a card sets `bg-surface` and a `<span>` three levels down sets only
 * `text-content-muted`. Regex cannot pair those because it cannot see nesting, so this walks the
 * real JSX tree and carries the enclosing background down as a stack.
 *
 * Limits worth stating rather than glossing:
 *   - Only nesting WITHIN one file is followed. A component rendered onto a parent's surface in some
 *     other file is invisible here; the root fallback below stands in for that case.
 *   - Backgrounds set through a prop, a `cn()` argument or a variant map are not resolved.
 * So this widens coverage a great deal without ever becoming exhaustive.
 */
import ts from 'typescript';

/** Elements with no ancestor background are judged against the page itself, which is what renders. */
export const ROOT_SURFACES = ['background', 'surface-shell'];

/** Sentinel for a background that exists but cannot be resolved statically. */
const UNKNOWN = Symbol('unknown-background');

/**
 * The `/NN` opacity modifier is stripped, so `bg-surface-scrim/90` resolves as `surface-scrim`.
 *
 * Without this the whole class was silently skipped for not matching any token name, which is how
 * `text-content-inverse` on `bg-surface-scrim/90` survived: an always-black tooltip whose text
 * inverted to near-black in dark. Treating the alpha form as its base colour is an approximation —
 * the true blend depends on whatever sits behind — but it is far better than not checking at all,
 * and for a near-opaque scrim it is almost exact.
 */
const tokenFrom = (words, prefix) => {
	for (const w of words) {
		if (w.startsWith(prefix) && !w.includes(':')) return w.slice(prefix.length).split('/')[0];
	}
	return null;
};

/**
 * True when the element sets a background through something this walker cannot resolve — an inline
 * `style`, or a `bg-[...]`/`bg-<brand>` literal. Descendants must then be treated as sitting on an
 * UNKNOWN surface rather than on the page, or they get judged against a background that is not
 * theirs. The Cal.com tile is exactly this: `style={{ backgroundColor: '#0069FF' }}` with a
 * `text-content-inverse` icon inside, which looked like white-on-page-white until the parse.
 */
function hasOpaqueBackground(node, words) {
	if (words.some((w) => /^bg-\[/.test(w))) return true;
	return (node.attributes?.properties ?? []).some(
		(p) => ts.isJsxAttribute(p) && p.name.getText() === 'style' && /background/i.test(p.initializer?.getText() ?? ''),
	);
}

/** Static class words on one JSX element — string literals only, including those inside `cn(...)`. */
function classWords(node) {
	const attr = node.attributes?.properties?.find(
		(p) => ts.isJsxAttribute(p) && (p.name.getText() === 'className' || p.name.getText() === 'class'),
	);
	if (!attr?.initializer) return [];

	const out = [];
	const collect = (n) => {
		if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) out.push(...n.text.split(/\s+/));
		// A template's fixed spans are static even when its `${}` holes are not.
		else if (ts.isTemplateExpression(n)) {
			out.push(...n.head.text.split(/\s+/));
			for (const span of n.templateSpans) out.push(...span.literal.text.split(/\s+/));
		} else if (ts.isJsxExpression(n) && n.expression) collect(n.expression);
		else if (ts.isCallExpression(n)) n.arguments.forEach(collect);
		else if (ts.isConditionalExpression(n)) {
			collect(n.whenTrue);
			collect(n.whenFalse);
		} else if (ts.isBinaryExpression(n)) {
			collect(n.left);
			collect(n.right);
		}
	};
	collect(attr.initializer);
	return out.filter(Boolean);
}

/**
 * Yields `{ fg, bg, inherited }` for every text token paired with its enclosing background.
 * `emit` is called rather than returning an array so callers can attribute pairs to a file.
 */
export function walkColorPairs(source, fileName, emit) {
	const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

	const visit = (node, bgStack) => {
		let nextStack = bgStack;

		if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
			const opening = ts.isJsxElement(node) ? node.openingElement : node;
			const words = classWords(opening);
			const bg = tokenFrom(words, 'bg-');
			const fg = tokenFrom(words, 'text-');

			// UNKNOWN poisons the stack downward: better to check nothing than to check the wrong pair.
			const own = bg ?? (hasOpaqueBackground(opening, words) ? UNKNOWN : null);
			if (own) nextStack = [...bgStack, own];

			// The element's own background wins over anything it inherits.
			const effective = own ?? bgStack[bgStack.length - 1] ?? null;
			if (fg && effective !== UNKNOWN) emit({ fg, bg: effective, inherited: !own && effective !== null });
		}

		node.forEachChild((child) => visit(child, nextStack));
	};

	visit(sf, []);
}

/**
 * Yields `{ child, parent }` for every nested background pair — a `bg-*` element inside another.
 *
 * This exists to catch backgrounds that are INVISIBLE in light and loud in dark. Two greys a single
 * step apart (#fafafa and #F9F9F9) look like one surface in light, so a redundant background on a
 * text span goes unnoticed for years. Tokenizing maps them by ROLE rather than by value, and roles
 * diverge in dark — panel #1f1f22 versus sidebar chrome #0f0f10 — so the same markup renders a
 * near-black rectangle inside a lighter card.
 */
export function walkNestedBackgrounds(source, fileName, emit) {
	const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

	const visit = (node, parent) => {
		let next = parent;

		if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
			const opening = ts.isJsxElement(node) ? node.openingElement : node;
			const words = classWords(opening);
			const bg = tokenFrom(words, 'bg-');

			if (bg) {
				if (parent && parent !== bg) emit({ child: bg, parent });
				next = bg;
			} else if (hasOpaqueBackground(opening, words)) next = null;
		}

		node.forEachChild((child) => visit(child, next));
	};

	visit(sf, null);
}

/**
 * Yields `{ fg, bg }` for each variant string inside a `cva(...)` call.
 *
 * These never appear in JSX, so walkColorPairs cannot see them — yet they carry the app's most-used
 * pairing by far: every filled button is `bg-primary` with `text-primary-foreground`. One variant
 * string is one element's worth of classes, so a `bg-` and a `text-` inside it are a real pair.
 */
export function walkVariantPairs(source, fileName, emit) {
	const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

	const visit = (node) => {
		if (ts.isCallExpression(node) && node.expression.getText() === 'cva') {
			const strings = [];
			const gather = (n) => {
				if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) strings.push(n.text);
				else n.forEachChild(gather);
			};
			node.arguments.forEach(gather);

			for (const s of strings) {
				const words = s.split(/\s+/).filter((w) => w && !w.includes(':'));
				const bg = words.find((w) => w.startsWith('bg-'))?.slice(3);
				const fg = words.find((w) => w.startsWith('text-'))?.slice(5);
				if (bg && fg) emit({ fg, bg });
			}
		}
		node.forEachChild(visit);
	};

	visit(sf);
}
