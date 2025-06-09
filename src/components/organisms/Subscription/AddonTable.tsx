// import { useState } from 'react'
// import { getCurrencySymbol, SuperAddOnConversion } from '@/utils/utility_functions'
// import { PriceTier } from '@/api/models/model_product_detail'
// import { FaTrash } from 'react-icons/fa6'
// import { IoMdClose } from 'react-icons/io'
// interface PlanConfigTableProps {
//     addOnConfig: SuperAddOnConversion
//     selectedAddonIds: string[]
//     billingPeriod: string
//     onValueChanged: (key: string, value: string) => void
//     onDelete?: (key: string) => void
// }

// export default function AddonConfigTable({
//     addOnConfig,
//     selectedAddonIds,
//     onValueChanged,
//     billingPeriod,
//     onDelete,
// }: PlanConfigTableProps) {
//     const [showTiers, setShowTiers] = useState<{ [key: string]: boolean }>({})

//     const calculateTieredPrice = (quantity: number, tiered: PriceTier[] | undefined) => {
//         if (!tiered) return 0
//         for (const tier of tiered) {
//             const upTo = tier.up_to === 999999999 ? Infinity : Number(tier.up_to)
//             if (quantity <= upTo) {
//                 return tier.price
//             }
//         }

//         return 0
//     }

//     return (
//         <div className="border rounded-xl pt-2 pb-2 bg-gray-100">
//             <table className="min-w-full">
//                 <thead className="rounded-xl">
//                     <tr className="bg-gray-100">
//                         <th className="px-4 py-2 text-left text-gray-600">Charge</th>
//                         <th className="px-4 py-2 text-left text-gray-600">Quantity</th>
//                         <th className="px-4 py-2 text-left text-gray-600">Price</th>
//                         {onDelete && <th className="px-4 py-2 text-left text-gray-600"></th>}
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {Object.keys(addOnConfig)
//                         .filter((key) => selectedAddonIds.includes(key))
//                         .map((key) => {
//                             const addon = addOnConfig[key]
//                             const billingDetails = billingPeriod === 'monthly' ? addon.monthly : addon.annual

//                             return (
//                                 <tr key={key} className="border-t bg-white items-center align-middle">
//                                     <td className="px-4 py-3">{addon.name}</td>
//                                     <td className="px-4 py-3">
//                                         <Input
//                                             name={''}
//                                             label={''}
//                                             placeholder={'0'}
//                                             field={{
//                                                 value: addon.quantity,
//                                                 onChange: (e: any) => onValueChanged(key, e.target.value),
//                                             }}
//                                         />
//                                     </td>
//                                     <td className="px-4 py-3">
//                                         {billingDetails?.type === 'flat' ? (
//                                             <>
//                                                 {getCurrencySymbol(billingDetails.currency)}
//                                                 {billingDetails?.price?.toFixed(2) || 'N/A'} {`/ unit`} /{billingPeriod}
//                                             </>
//                                         ) : (
//                                             <>
//                                                 <div className="flex gap-2 flex-col items-start justify-center">
//                                                     <span>
//                                                         {getCurrencySymbol(billingDetails?.currency ?? 'USD')}
//                                                         {calculateTieredPrice(
//                                                             addon.quantity,
//                                                             billingDetails?.price_tiers
//                                                         ).toFixed(2)}{' '}
//                                                         {'unit'} / {billingPeriod}
//                                                     </span>
//                                                     <button
//                                                         onClick={() =>
//                                                             setShowTiers({ ...showTiers, [addon.name]: true })
//                                                         }
//                                                         className="ml-2 text-sm text-blue-500 underline"
//                                                     >
//                                                         View Tiers
//                                                     </button>
//                                                 </div>
//                                                 {showTiers[addon.name] && (
//                                                     <div className="fixed top-0 left-0 z-[200] w-full h-full flex items-center justify-center bg-black bg-opacity-50">
//                                                         <div className="bg-white p-6 rounded-lg shadow-lg w-500">
//                                                             <div className="flex items-start justify-between gap-12">
//                                                                 <h3 className="text-base font-normal mb-4 text-center text-gray-800">
//                                                                     Price Tiers for {addon.name}
//                                                                 </h3>
//                                                                 <button
//                                                                     onClick={() =>
//                                                                         setShowTiers({
//                                                                             ...showTiers,
//                                                                             [addon.name]: false,
//                                                                         })
//                                                                     }
//                                                                     className="text-xl h-full"
//                                                                 >
//                                                                     <IoMdClose />
//                                                                 </button>
//                                                             </div>
//                                                             <div className="rounded-lg border border-gray-300">
//                                                                 <table className="min-w-full rounded-lg border border-gray-300 divide-y divide-gray-200">
//                                                                     <thead>
//                                                                         <tr className="bg-gray-100">
//                                                                             <th className="px-4 py-2 text-left text-gray-600">
//                                                                                 Range
//                                                                             </th>
//                                                                             <th className="px-4 py-2 text-left text-gray-600">
//                                                                                 Price
//                                                                             </th>
//                                                                             <th className="px-4 py-2 text-left text-gray-600">
//                                                                                 Currency
//                                                                             </th>
//                                                                         </tr>
//                                                                     </thead>
//                                                                     <tbody>
//                                                                         {billingDetails?.price_tiers?.map(
//                                                                             (tier, index) => {
//                                                                                 const prevUpTo =
//                                                                                     index === 0
//                                                                                         ? 1
//                                                                                         : Number(
//                                                                                               billingDetails.price_tiers![
//                                                                                                   index - 1
//                                                                                               ].up_to
//                                                                                           ) + 1
//                                                                                 const currentUpTo =
//                                                                                     tier.up_to === 999999999
//                                                                                         ? '∞'
//                                                                                         : tier.up_to
//                                                                                 return (
//                                                                                     <tr
//                                                                                         key={index}
//                                                                                         className="border border-gray-300 hover:bg-gray-50"
//                                                                                     >
//                                                                                         <td className="px-4 py-2">
//                                                                                             {prevUpTo} - {currentUpTo}
//                                                                                         </td>
//                                                                                         <td className="px-4 py-2 font-medium">
//                                                                                             {tier.price.toFixed(2)}
//                                                                                         </td>
//                                                                                         <td className="px-4 py-2">
//                                                                                             {billingDetails?.currency}
//                                                                                         </td>
//                                                                                     </tr>
//                                                                                 )
//                                                                             }
//                                                                         )}
//                                                                     </tbody>
//                                                                 </table>
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                 )}
//                                             </>
//                                         )}
//                                     </td>
//                                     {onDelete && (
//                                         <td className="px-4 py-3">
//                                             <button
//                                                 onClick={() => onDelete(key)}
//                                                 className="text-sm text-white bg-gray-300  p-2 rounded"
//                                             >
//                                                 <FaTrash />
//                                             </button>
//                                         </td>
//                                     )}
//                                 </tr>
//                             )
//                         })}
//                 </tbody>
//             </table>
//         </div>
//     )
// }
