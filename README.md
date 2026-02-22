# Miami ID Therapy

Expo iOS app with a light UI and an Activities panel.

## Run the app

```bash
npm install
npm run ios
```

Use the iOS simulator or scan the QR code with Expo Go on a device.

## Structure

- **Activities** – Home screen with a panel of buttons (Breathing, Mindfulness, Journal, Movement, Grounding). Tap any button to open that activity.
- **Activity Detail** – Placeholder screen for each activity with a “Back to Activities” button.
- **Community Center** – Brave Moment (one daily social challenge; “I did it” → “How did it feel?” → brick on the wall), plus level-1 dialog options and “speak in your own words” recording. Uses `assets/community-center/conversation.png` as background—add that image if missing.

Navigation uses React Navigation (native stack) with a light theme.
