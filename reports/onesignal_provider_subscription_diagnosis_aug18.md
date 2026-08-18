# OneSignal Provider Subscription Diagnosis — 18 August 2026

## Confirmed evidence

The future-message probe to the OneSignal Create Message API returned HTTP 200 with an empty message ID and the provider error: `All included players are not subscribed`. The owner’s direct JAMB Quest notification test can still appear because the server falls back to the existing browser VAPID subscription when OneSignal does not return an eligible recipient. Therefore, a visible direct test is **not evidence of a provider-managed OneSignal Web Push subscription**.

## Official integration requirements

OneSignal’s Web SDK documentation states that a Web Push subscription is created when a browser user opts in, and that `login(external_id)` associates the current device subscription with the application user. It recommends calling `login` on every signed-in page load. The custom-code guidance requires the exact production origin, a valid hosted worker file, and an actual subscribed entry in **Audience → Subscriptions** before provider-side targeting is possible. The future-message API supports `send_after`, while the cancel-message API accepts `DELETE /notifications/{message_id}?app_id={app_id}` for a previously scheduled message. [1] [2] [3]

## Implication for JAMB Quest

The provider-scheduled queue is implemented, but it must remain empty until the browser successfully completes a real OneSignal subscription. The next repair must explicitly opt in the OneSignal PushSubscription after login, expose its state to the Profile, and confirm that OneSignal lists the user’s device as **Subscribed** before any future messages are queued.

## Explicit device diagnostic requirement

The Web SDK v16 reference distinguishes a granted browser permission from a provider-visible Web Push subscription. JAMB Quest must expose the local OneSignal identity (`User.externalId` and `User.onesignalId`), the device subscription identifier (`User.PushSubscription.id`), and `User.PushSubscription.optedIn`; a false opt-in value or missing subscription identifier is an unregistered provider device, even where the browser notification permission is granted. The provider probe remains the final server-side gate for future alias-targeted messages. [1]

OneSignal’s troubleshooting guidance also requires a non-private supported browser, the exact HTTPS origin configured in the provider app, a public JavaScript worker at the configured path and scope, and an enabled browser notification channel. On Android, a browser notification channel can be silent or disabled independently from the high-level browser notification permission. [4]

| Diagnostic field | Meaning for JAMB Quest |
| --- | --- |
| Browser permission | The browser accepted notifications; this alone does not prove provider enrollment. |
| OneSignal external ID | Must equal the authenticated learner ID after login. |
| OneSignal ID | The current provider user context in the browser. |
| Push subscription ID | The provider-visible browser-device identifier required for a targetable subscription. |
| `optedIn` | The current OneSignal Web Push state for that device. |
| Provider probe | The only server-side evidence that a future alias-targeted message has a valid recipient. |

## References

[1]: https://documentation.onesignal.com/docs/en/web-sdk-reference
[2]: https://documentation.onesignal.com/docs/en/web-push-custom-code-setup
[3]: https://documentation.onesignal.com/reference/cancel-message
[4]: https://documentation.onesignal.com/docs/en/troubleshooting-web-push
