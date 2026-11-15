/** Isolate Latin phrases and their numbers from the surrounding Arabic flow.
 * Keep JSON plain text: direction belongs to the rendering layer.
 */
export default function MixedText({ children }: { children: string }) {
  const parts = children.split(/([\p{Script=Latin}0-9](?:[-\p{Script=Latin}0-9 ()'’".,&+:/]*[\p{Script=Latin}0-9])?\)?)/gu)
  return <span dir="rtl" className="mixed-text">{parts.map((part, index) => index % 2 ? <bdi key={index} dir="ltr">{part}</bdi> : part)}</span>
}
