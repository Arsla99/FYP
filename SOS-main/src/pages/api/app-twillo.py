from flask import Flask, request, jsonify
from flask_cors import CORS
from twilio.rest import Client
import os

app = Flask(__name__)
CORS(app)

# Credentials must be set as environment variables — never hardcode
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
twilio_number = os.environ["TWILIO_PHONE_NUMBER"]

client = Client(account_sid, auth_token)

@app.route('/send-sos', methods=['POST'])
def send_sos():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    location = data.get('location', 'Unknown location')
    contacts = data.get('contacts', [])
    user_name = data.get('userName', 'User')
    emotion = data.get('emotion', 'unknown')
    fear_level = data.get('fearLevel', 0)
    trigger_method = data.get('triggerMethod', 'Manual')

    if not contacts:
        return jsonify({'success': False, 'error': 'No contacts provided'}), 400

    message_body = (
        f"🚨 EMERGENCY SOS ALERT 🚨\n\n"
        f"From: {user_name}\n"
        f"Location: {location}\n"
        f"Trigger: {trigger_method}\n"
        f"Emotion: {emotion} ({fear_level}%)\n\n"
        f"Please check on {user_name} immediately!"
    )

    results = []
    success_count = 0

    for contact in contacts:
        phone = contact.get('phone', '')
        name = contact.get('name', 'Contact')
        if not phone:
            results.append({'name': name, 'phone': phone, 'status': 'failed', 'error': 'No phone'})
            continue
        try:
            msg = client.messages.create(body=message_body, from_=twilio_number, to=phone)
            results.append({'name': name, 'phone': phone, 'status': 'sent', 'sid': msg.sid})
            success_count += 1
        except Exception as e:
            results.append({'name': name, 'phone': phone, 'status': 'failed', 'error': str(e)})

    status = 200 if success_count > 0 else 500
    return jsonify({'success': success_count > 0, 'contactsNotified': success_count, 'results': results}), status

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
