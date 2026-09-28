/* ==========================================================================
   EMAILJS CONFIGURATION (optional but recommended) — sends the booking
   confirmation emails automatically from the salon's Gmail.

   1. Sign up free at https://www.emailjs.com (200 emails/month free).
   2. "Email Services" > Add service > Gmail > connect hairtraderpotential@gmail.com.
      Copy the Service ID.
   3. "Email Templates" > Create template. Set:
        To Email:  {{to_email}}
        Subject:   {{subject}}
        Content (switch to code/HTML view):  {{{message_html}}}
      Save and copy the Template ID.
   4. "Account" > General: copy your Public Key.
   Paste the three values below.
   ========================================================================== */
const EMAILJS_CONFIG = {
    serviceId: "service_dyj7o3d",
    templateId: "template_a3cbd8c",
    publicKey: "2GCuUv4sdbDVbooT7"



  // Where the "new booking request" alert is sent. While testing, put YOUR email
  // here so you receive it. Before going live, change it back to Promise's:
  // hairtraderpotential@gmail.com
  notifyEmail: "olwethuthando63@gmail.com"
};
