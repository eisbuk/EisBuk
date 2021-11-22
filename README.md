# EisBuk

## Booking management for ice skating lessons


### As an admin you can:

- login as an admin in an organization.
- create slots
- slots have multiple intervals and the following properties:
  - duration
  - type: on or off-ice
  - category: competitive level of the athletes in that slot
- mark athletes as present or absent in each slot.
- view and manage your slots in calendar view.

### As an athlete you can:

- view available slots without logging in, using a secret uinque url as authentication.
- book a slot according to your level and the type of session you need.
- view your booked slots in calendar view.

## Built with:

- - [ReactJS](https://reactjs.org/) - open-source JavaScript library for building user interfaces.

## Working locally on eisbuk-admin

Enter the eisbuk-admin directory:

    cd eisbuk-admin

Start the firebase emulators:

    yarn emulators:start

The `--inspect-functions` allows you to connect with a debugger, for instance chrome from chrome://inspect/#devices or from the VSCode debugger.

Start the webpack development server as usual:

    yarn start

Head your browser to http://localhost:3000/debug and click the "Create admin test users" button.

Start storybook

    yarn storybook

## Contribution

EisBuk is a booking system developed for an ice skating school.
It's open source, so if it fits your needs you can install it and use it.

If you want to work on the code you'll need to install the husky pre-commit hooks.

