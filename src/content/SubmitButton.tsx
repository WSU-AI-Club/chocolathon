/* The submissions button: locked with the countdown until 1:00 PM on
   Saturday, September 19 (Wichita time), then the amber link to the
   Microsoft Form. In the HQ band on the landing page and in the rules
   section of HQ. See TimedButton for the mechanics. */

import { SUBMISSIONS_OPEN_AT, SUBMISSION_URL } from "./links";
import TimedButton from "./TimedButton";

export default function SubmitButton({ className = "" }: { className?: string }) {
  return (
    <TimedButton
      opensAt={SUBMISSIONS_OPEN_AT}
      href={SUBMISSION_URL}
      lockedLabel="Submissions open Sat 1:00 PM"
      openLabel="Submit your project"
      title="Submissions open at 1:00 PM on Saturday, September 19, and close at 2:15."
      external
      className={className}
    />
  );
}
