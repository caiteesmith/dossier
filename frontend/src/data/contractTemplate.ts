// ── Default wedding photography contract template ─────────────────
// Placeholders: {{PARTNER_ONE}}, {{PARTNER_TWO}}, {{DATE}}, {{VENUE}},
// {{PACKAGE}}, {{PRICE}}, {{RETAINER}}, {{FINAL_DUE}}, {{HOURS}},
// {{PHOTOGRAPHER}}, {{BUSINESS}}, {{TODAY}}

export const DEFAULT_CONTRACT_TEMPLATE = `WEDDING PHOTOGRAPHY SERVICES AGREEMENT

This agreement is entered into as of {{TODAY}}, between {{BUSINESS}} ("Photographer") and {{PARTNER_ONE}} and {{PARTNER_TWO}} ("Client").

1. EVENT DETAILS

Wedding date: {{DATE}}
Venue: {{VENUE}}
Package: {{PACKAGE}}
Coverage: {{HOURS}} hours
Total investment: {{PRICE}}

2. PAYMENT SCHEDULE

A non-refundable retainer of {{RETAINER}} is due upon signing this agreement to reserve the date. The remaining balance of {{FINAL_BALANCE}} is due no later than 30 days prior to the wedding date ({{FINAL_DUE}}).

Payments may be made by check, bank transfer, or credit card. Dates are not reserved until the retainer is received and this agreement is signed by both parties.

3. CANCELLATION POLICY

In the event Client cancels the booking, the retainer is non-refundable regardless of the reason for cancellation. If cancellation occurs within 90 days of the wedding date, Client is responsible for 50% of the remaining balance. If cancellation occurs within 30 days of the wedding date, Client is responsible for the full remaining balance.

In the event Photographer must cancel due to illness, injury, or circumstances beyond their control, Photographer will make every reasonable effort to find a qualified replacement photographer. If a replacement cannot be found, all payments beyond the retainer will be refunded.

4. COPYRIGHT AND USAGE

Photographer retains full copyright over all images produced under this agreement. Client is granted a non-exclusive, non-transferable license to use the final delivered images for personal, non-commercial purposes including printing, sharing with family and friends, and posting on personal social media accounts with credit given to Photographer.

Client may not sell, license, or use images for commercial purposes without prior written consent from Photographer.

Photographer reserves the right to use images from this event for portfolio, website, social media, blog posts, printed materials, and other promotional purposes. If Client wishes to restrict this usage, a written request must be submitted prior to the event.

5. IMAGE DELIVERY

Photographer will deliver a gallery of fully edited images within 6–8 weeks of the wedding date. The number of images delivered is at Photographer's professional discretion and is not guaranteed to a specific count.

The online gallery will be available for download for 90 days after delivery. Client is responsible for downloading and backing up all images within that window.

6. TIMELINE AND COOPERATION

Client agrees to cooperate with Photographer's timeline recommendations. Photographer is not responsible for missed moments due to delays outside their control, including late ceremonies, weather, or uncooperative guests.

Family formals are the joint responsibility of Client and Photographer. Client agrees to designate a family member to assist with organizing groups.

7. EQUIPMENT AND BACKUP

Photographer carries backup equipment to all events. Photographer's equipment is not covered under Client's homeowner's or event insurance.

In the unlikely event of equipment failure, media corruption, or other technical failure beyond Photographer's control, Photographer's liability is limited to a refund of monies paid.

8. CONDUCT

Photographer reserves the right to terminate coverage and leave the event if Client or their guests behave in a manner that is abusive, threatening, or creates an unsafe working environment. No refund will be issued in this circumstance.

9. ENTIRE AGREEMENT

This agreement constitutes the entire agreement between the parties and supersedes all prior discussions, representations, or agreements. Any modifications must be in writing and signed by both parties.

IN WITNESS WHEREOF, the parties have executed this agreement as of the date first written above.`

export function fillTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return Object.entries(vars).reduce(
    (t, [key, val]) => t.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val),
    template
  )
}