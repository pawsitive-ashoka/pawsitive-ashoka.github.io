
# Pawsitive — Contact Form Email Template

## How to Use with EmailJS

1. Log in at [emailjs.com](https://www.emailjs.com/) → **Email Templates** → **Create New Template**
2. Set the following fields:
     - **To email:** `pawsitive@ashoka.edu.in`
     - **From name:** `{{from_name}} via Pawsitive Website`
     - **Reply-To:** `{{from_email}}`
     - **Subject:** `[Pawsitive] {{topic}} — from {{from_name}}`
3. Paste the HTML below into the template body (**HTML mode**).
4. Save the template and note down the **Template ID**.
5. Paste that ID into `js/contact.js` as `EMAILJS_TEMPLATE_ID`.

---

## Template Variables

These variables are auto-filled from the contact form:

| Variable        | Description                        |
|-----------------|------------------------------------|
| `{{from_name}}` | Sender's name                      |
| `{{from_email}}`| Sender's email address             |
| `{{topic}}`     | Selected topic from dropdown        |
| `{{message}}`   | The message body                   |

---

Paste your HTML template below this line:

```html
<!-- Your email template HTML goes here -->
```
