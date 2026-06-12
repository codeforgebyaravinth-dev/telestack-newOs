# test_email.py
import smtplib
import ssl
from email.message import EmailMessage

def test_smtp():
    try:
        # Try SSL on port 465
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("mail.rp-infotech.com", 465, context=context) as server:
            server.login("rpsignage@rp-infotech.com", "Rp&@20252026")
            print("✅ SSL connection successful on port 465")
            
            # Send test email
            msg = EmailMessage()
            msg.set_content("Test email from your SMTP configuration")
            msg["Subject"] = "SMTP Test"
            msg["From"] = "rpsignage@rp-infotech.com"
            msg["To"] = "codeforgebyaravinth@gmail.com"
            
            server.send_message(msg)
            print("✅ Test email sent successfully")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_smtp()