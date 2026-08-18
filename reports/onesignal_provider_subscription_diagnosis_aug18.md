# OneSignal Provider Subscription Diagnosis — 18 August 2026

## Confirmed evidence

The future-message probe to the OneSignal Create Message API returned HTTP 200 with an empty message ID and the provider error: `All included players are not subscribed`. The owner’s direct JAMB Quest notification test can still appear because the server falls back to the existing browser VAPID subscription when OneSignal does not return an eligible recipient. Therefore, a visible direct test is **not evidence of a provider-managed OneSignal Web Push subscription**.

## Official integration requirements

OneSignal’s Web SDK documentation states that a Web Push subscription is created when a browser user opts in, and that `login(external_id)` associates the current device subscription with the application user. It recommends calling `login` on every signed-in page load. The custom-code guidance requires the exact production origin, a valid hosted worker file, and an actual subscribed entry in **Audience → Subscriptions** before provider-side targeting is possible. The future-message API supports `send_after`, while the cancel-message API accepts `DELETE /notifications/{message_id}?app_id={app_id}` for a previously scheduled message. [1] [2] [3]

## Implication for JAMB Quest

The provider-scheduled queue is implemented, but it must remain empty until the browser successfully completes a real OneSignal subscription. The next repair must explicitly opt in the OneSignal PushSubscription after login, expose its state to the Profile, and confirm that OneSignal lists the user’s device as **Subscribed** before any future messages are queued.

## References

[1]: https://documentation.onesignal.com/docs/en/web-sdk-reference
[2]: https://documentation.onesignal.com/docs/en/web-push-custom-code-setup
[3]: https://documentation.onesignal.com/reference/cancel-message
