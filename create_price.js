const stripe = require('stripe')('sk_test_51OQMzRK8hceL936mSUQdQHBBP0iLnmlj5JoDML4PsQBGSN17Nx79Y1ZyJBtfgj9WG6Jhfw25QWOzTkV0vx6IzZDq00ikPd6LdT');

stripe.products.create({
  name: 'Starter Subscription',
  description: '$12/Month subscription',
}).then(product => {
  stripe.prices.create({
    unit_amount: 1200,
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
    product: product.id,
  }).then(price => {
    console.log('Success! Here is your starter subscription product id: ' + product.id);
    console.log('Success! Here is your starter subscription price id: ' + price.id);
  });
});