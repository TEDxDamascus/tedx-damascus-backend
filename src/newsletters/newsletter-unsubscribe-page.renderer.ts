import { Injectable } from '@nestjs/common';

@Injectable()
export class NewsletterUnsubscribePageRenderer {
  renderConfirmation(token: string): string {
    const encodedToken = encodeURIComponent(token);

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Unsubscribe | TEDx Damascus</title>
  </head>
  <body>
    <main>
      <h1>Unsubscribe</h1>
      <p>Do you want to stop receiving TEDx Damascus newsletters?</p>
      <form method="post" action="/newsletters/unsubscribe?token=${encodedToken}">
        <button type="submit">Unsubscribe</button>
      </form>
    </main>
  </body>
</html>`;
  }
}
