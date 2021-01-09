# platno-json-to-yup

## Quick start

Install

`npm install platno-json-to-yup --save`

Use

```js
import { buildYupSchema } from 'platno-json-to-yup';

const yupSchema = buildYupSchema({
  id: {
    type: 'number',
    positive: true,
  },
  username: {
    type: 'string',
    required: true,
    min: 8,
    max: 12,
  },
  password: {
    type: 'string',
    required: true,
    matches: /^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/,
  },
  active: {
    type: 'boolean',
  },
  created: {
    type: 'date',
    min: parse('2020-04-15', 'yyyy-MM-dd', new Date()),
    max: parse('2020-04-20', 'yyyy-MM-dd', new Date()),
  },
  tags: {
    type: 'array',
    min: 3,
  },
});
```

This would generate the following Yup validation schema:

```js
const schema = yup.object().shape({
  id: yup.number()
    .positive(),
  username: yup.string()
    .required()
    .min(8)
    .max(12),
  password: yup.string()
    .required()
    .matches(/^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/),
  active: yup.boolean(),
  created: yup.date()
    .min(parse('2020-04-15', 'yyyy-MM-dd', new Date()))
    .max(parse('2020-04-20', 'yyyy-MM-dd', new Date())),
  tags: yup.array()
    .min(3),
});
```
