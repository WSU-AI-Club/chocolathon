/* The prompts button: locked with the countdown until midnight on
   September 14 (Wichita time), then the amber link into Competition HQ.
   Sits in the hero on both paths and in the HQ band, so nobody has to
   find HQ to reach the prompts. See TimedButton for the mechanics. */

import { PROMPTS_HREF, PROMPTS_RELEASE_AT } from "./links";
import TimedButton from "./TimedButton";

export default function PromptsButton({ className = "" }: { className?: string }) {
  return (
    <TimedButton
      opensAt={PROMPTS_RELEASE_AT}
      href={PROMPTS_HREF}
      lockedLabel="Prompts unlock Sep 14"
      openLabel="See the prompts"
      title="The prompts unlock at midnight on September 14, Wichita time."
      className={className}
    />
  );
}
