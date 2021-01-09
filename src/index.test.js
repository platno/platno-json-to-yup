import { parse } from 'date-fns';
import * as Yup from 'yup';
import noop from 'lodash/noop';

import {
  YupTypesNames,
  isYupType,
  getNormalizedConfig,
  getYupType,
  applyMethodsOnType,
  buildYupSchema,
} from './index';

describe('platno-json-to-yup', () => {
  test('isYupType', () => {
    expect(isYupType('array'))
      .toEqual(true);
    expect(isYupType('boolean'))
      .toEqual(true);
    expect(isYupType('date'))
      .toEqual(true);
    expect(isYupType('mixed'))
      .toEqual(true);
    expect(isYupType('number'))
      .toEqual(true);
    expect(isYupType('object'))
      .toEqual(true);
    expect(isYupType('string'))
      .toEqual(true);
    expect(isYupType('password'))
      .toEqual(false);
  });

  describe('getNormalizedConfig', () => {
    test('type', () => {
      expect(getNormalizedConfig('string'))
        .toEqual({ type: YupTypesNames.STRING });
      expect(getNormalizedConfig({ type: 'string' }))
        .toEqual({ type: YupTypesNames.STRING, methods: [] });

      expect(() => {
        getNormalizedConfig('password');
      }).toThrow('Type password is not valid type.');
      expect(() => {
        getNormalizedConfig({ required: true });
      }).toThrow('Type undefined is not valid type.');
      expect(() => {
        getNormalizedConfig([]);
      }).toThrow('Invalid configuration ()');
      expect(() => {
        getNormalizedConfig(true);
      }).toThrow('Invalid configuration (true)');
    });

    test('methods', () => {
      expect(getNormalizedConfig({
        type: 'string',
        required: true,
      }))
        .toEqual({
          type: YupTypesNames.STRING,
          methods: [
            {
              name: 'required',
              args: true,
            },
          ],
        });
      expect(getNormalizedConfig({
        type: 'string',
        required: true,
        min: 3,
        max: 5,
      }))
        .toEqual({
          type: YupTypesNames.STRING,
          methods: [
            {
              name: 'required',
              args: true,
            },
            {
              name: 'min',
              args: 3,
            },
            {
              name: 'max',
              args: 5,
            },
          ],
        });
    });
  });

  describe('getYupType', () => {
    test('array', () => {
      expect(getYupType({ type: YupTypesNames.ARRAY }).isType([]))
        .toEqual(true);
      expect(getYupType({ type: YupTypesNames.ARRAY }).isType([1, 2, 3]))
        .toEqual(true);
      expect(getYupType({ type: YupTypesNames.ARRAY }).isType())
        .toEqual(false);
      expect(getYupType({ type: YupTypesNames.ARRAY }).isType(true))
        .toEqual(false);
    });
    test('boolean', () => {
      expect(getYupType({ type: YupTypesNames.BOOLEAN }).isType(true))
        .toEqual(true);
      expect(getYupType({ type: YupTypesNames.BOOLEAN }).isType(false))
        .toEqual(true);
      expect(getYupType({ type: YupTypesNames.BOOLEAN }).isType())
        .toEqual(false);
      expect(getYupType({ type: YupTypesNames.BOOLEAN }).isType('true'))
        .toEqual(false);
    });
    test('date', () => {
      expect(getYupType({ type: YupTypesNames.DATE }).isType(new Date()))
        .toEqual(true);
      expect(getYupType({ type: YupTypesNames.DATE }).isType())
        .toEqual(false);
      expect(getYupType({ type: YupTypesNames.DATE }).isType(true))
        .toEqual(false);
    });
    test('number', () => {
      expect(getYupType({ type: YupTypesNames.NUMBER }).isType(1))
        .toEqual(true);
      expect(getYupType({ type: YupTypesNames.NUMBER }).isType())
        .toEqual(false);
      expect(getYupType({ type: YupTypesNames.NUMBER }).isType(true))
        .toEqual(false);
    });
    test('string', () => {
      expect(getYupType({ type: YupTypesNames.STRING }).isType('Lorem Ipsum'))
        .toEqual(true);
      expect(getYupType({ type: YupTypesNames.STRING }).isType())
        .toEqual(false);
      expect(getYupType({ type: YupTypesNames.STRING }).isType(true))
        .toEqual(false);
    });

    test('exception', () => {
      expect(() => {
        getYupType({ type: 'password' });
      }).toThrow('Type password is not valid type.');
    });
  });

  describe('applyMethodsOnType', () => {
    test('default', () => {
      expect(
        applyMethodsOnType(
          getYupType({ type: YupTypesNames.STRING }),
          YupTypesNames.STRING,
          [
            {
              name: 'required',
              args: true,
            },
            {
              name: 'min',
              args: 3,
            },
            {
              name: 'max',
              args: 5,
            },
          ],
        )
          .describe(),
      )
        .toEqual({
          label: noop(),
          meta: noop(),
          tests: [
            {
              name: 'required',
              params: noop(),
            },
            {
              name: 'min',
              params: {
                min: 3,
              },
            },
            {
              name: 'max',
              params: {
                max: 5,
              },
            },
          ],
          type: 'string',
        });

      expect(() => {
        applyMethodsOnType(
          getYupType({ type: YupTypesNames.STRING }),
          YupTypesNames.STRING,
          [
            {
              name: 'password',
              args: true,
            },
          ],
        );
      })
        .toThrow('Invalid method password on string type');
    });

    test('custom', () => {
      Yup.addMethod(
        Yup.string,
        'passcode',
        () => Yup.string()
          .length(4),
      );

      expect(
        applyMethodsOnType(
          getYupType({ type: YupTypesNames.STRING }),
          YupTypesNames.STRING,
          [
            {
              name: 'passcode',
            },
          ],
        )
          .describe(),
      )
        .toEqual({
          label: noop(),
          meta: noop(),
          tests: [
            {
              name: 'length',
              params: {
                length: 4,
              },
            },
          ],
          type: 'string',
        });
    });
  });

  describe('buildYupSchema', () => {
    test('schema', () => {
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

      expect(
        yupSchema.validateSync(
          {
            id: 6,
            username: 'petar1983',
            password: 'Test1234!',
            active: true,
            created: parse('2020-04-17', 'yyyy-MM-dd', new Date()),
            tags: ['javascript', 'html', 'css'],
          },
          { abortEarly: false },
        ),
      )
        .toEqual({
          id: 6,
          username: 'petar1983',
          password: 'Test1234!',
          active: true,
          created: parse('2020-04-17', 'yyyy-MM-dd', new Date()),
          tags: ['javascript', 'html', 'css'],
        });

      expect(() => {
        yupSchema.validateSync(
          {
            id: -1,
            username: 'petar',
            password: 'teeessst',
            active: true,
            created: parse('2020-04-21', 'yyyy-MM-dd', new Date()),
            tags: ['javascript', 'html'],
          },
          { abortEarly: false },
        );
      })
        .toThrowError(Yup.ValidationError);
    });

    test('exceptions', () => {
      expect(() => {
        buildYupSchema({
          username: 'string',
          passowrd: 'password',
        });
      }).toThrow('Type password is not valid type.');

      expect(() => {
        buildYupSchema({
          passowrd: {
            type: 'string',
            required: true,
            min: 3,
            max: 5,
            password: true,
          },
        });
      }).toThrow('Invalid method password on string type');
    });

    describe('methods', () => {
      describe('array', () => {
        test('default', () => {
          const yupSchema = buildYupSchema({
            tags: 'array',
          });

          expect(yupSchema.isValidSync({ tags: ['javascript', 'html', 'css'] }))
            .toEqual(true);
          expect(yupSchema.isValidSync())
            .toEqual(true);
          expect(yupSchema.isValidSync({ tags: true }))
            .toEqual(false);
        });
        test('required', () => {
          const yupSchema = buildYupSchema({
            tags: {
              type: 'array',
              required: true,
            },
          });

          expect(yupSchema.isValidSync({ tags: ['javascript', 'html', 'css'] }))
            .toEqual(true);
          expect(yupSchema.isValidSync())
            .toEqual(false);
        });
        test('min/max', () => {
          const yupSchema = buildYupSchema({
            tags: {
              type: 'array',
              required: true,
              min: 3,
              max: 5,
            },
          });

          expect(yupSchema.isValidSync({ tags: ['javascript', 'html', 'css'] }))
            .toEqual(true);
          expect(yupSchema.isValidSync())
            .toEqual(false);
          expect(yupSchema.isValidSync({ tags: ['javascript', 'html'] }))
            .toEqual(false);
          expect(yupSchema.isValidSync({ tags: ['javascript', 'html', 'css', 'react', 'redux', 'd3'] }))
            .toEqual(false);
        });
      });

      describe('boolean', () => {
        test('default', () => {
          const yupSchema = buildYupSchema({
            active: 'boolean',
          });

          expect(yupSchema.isValidSync({ active: true }))
            .toEqual(true);
          expect(yupSchema.isValidSync({ active: 'false' }))
            .toEqual(true);
          expect(yupSchema.isValidSync())
            .toEqual(true);
          expect(yupSchema.isValidSync({ active: 'qwerty' }))
            .toEqual(false);
        });
        test('required', () => {
          const yupSchema = buildYupSchema({
            active: {
              type: 'boolean',
              required: true,
            },
          });

          expect(yupSchema.isValidSync({ active: true }))
            .toEqual(true);
          expect(yupSchema.isValidSync())
            .toEqual(false);
        });
      });

      describe('date', () => {
        test('default', () => {
          const yupSchema = buildYupSchema({
            created: 'date',
          });

          expect(yupSchema.isValidSync({ created: parse('2020-04-19', 'yyyy-MM-dd', new Date()) }))
            .toEqual(true);
          expect(yupSchema.isValidSync({ created: '2020-04-19' }))
            .toEqual(true);
          expect(yupSchema.isValidSync())
            .toEqual(true);
          expect(yupSchema.isValidSync({ created: 'qwerty' }))
            .toEqual(false);
        });
        test('required', () => {
          const yupSchema = buildYupSchema({
            created: {
              type: 'date',
              required: true,
            },
          });

          expect(yupSchema.isValidSync({ created: parse('2020-04-19', 'yyyy-MM-dd', new Date()) }))
            .toEqual(true);
          expect(yupSchema.isValidSync())
            .toEqual(false);
        });
        test('min/max', () => {
          const yupSchema = buildYupSchema({
            created: {
              type: 'date',
              required: true,
              min: parse('2020-04-15', 'yyyy-MM-dd', new Date()),
              max: parse('2020-04-20', 'yyyy-MM-dd', new Date()),
            },
          });

          expect(yupSchema.isValidSync({ created: parse('2020-04-14', 'yyyy-MM-dd', new Date()) }))
            .toEqual(false);
          expect(yupSchema.isValidSync({ created: parse('2020-04-19', 'yyyy-MM-dd', new Date()) }))
            .toEqual(true);
          expect(yupSchema.isValidSync({ created: parse('2020-04-21', 'yyyy-MM-dd', new Date()) }))
            .toEqual(false);
        });
      });

      describe('mixed', () => {
        test('oneOf', () => {
          const yupSchema = buildYupSchema({
            active: {
              type: 'boolean',
              oneOf: [true],
            },
            type: {
              type: 'number',
              oneOf: [1, 2, 3],
            },
          });

          expect(yupSchema.isValidSync({ active: true, type: 1 }))
            .toEqual(true);
          expect(yupSchema.isValidSync({ active: 'true', type: '1' }))
            .toEqual(true);
          expect(yupSchema.isValidSync({ active: false, type: 3 }))
            .toEqual(false);
          expect(yupSchema.isValidSync({ active: true, type: 4 }))
            .toEqual(false);
        });

        test('when', () => {
          const yupSchema = buildYupSchema({
            active: {
              type: 'boolean',
              required: true,
            },
            username: {
              type: 'mixed',
              when: {
                active: {
                  is: true,
                  then: {
                    type: 'string',
                    required: true,
                  },
                  otherwise: {
                    type: 'string',
                  },
                },
              },
            },
          });

          expect(yupSchema.isValidSync({ active: true, username: 'petar' }))
            .toEqual(true);
          expect(yupSchema.isValidSync({ active: false }))
            .toEqual(true);
          expect(yupSchema.isValidSync({ active: true }))
            .toEqual(false);

          expect(() => {
            buildYupSchema({
              active: {
                type: 'boolean',
                required: true,
              },
              username: {
                type: 'mixed',
                when: {
                  active: {
                    then: {
                      type: 'string',
                      required: true,
                    },
                    otherwise: {
                      type: 'string',
                    },
                  },
                },
              },
            });
          }).toThrow('Invalid configuration, property "is" is required in "when" method');

          expect(() => {
            buildYupSchema({
              active: {
                type: 'boolean',
                required: true,
              },
              username: {
                type: 'mixed',
                when: {
                  active: {
                    is: true,
                    otherwise: {
                      type: 'string',
                    },
                  },
                },
              },
            });
          }).toThrow('Invalid configuration, property "then" is required in "when" method');

          expect(() => {
            buildYupSchema({
              active: {
                type: 'boolean',
                required: true,
              },
              username: {
                type: 'mixed',
                when: {
                  active: {
                    is: true,
                    then: {
                      type: 'string',
                      required: true,
                    },
                  },
                },
              },
            });
          }).toThrow('Invalid configuration, property "otherwise" is required in "when" method');
        });
      });

      describe('number', () => {
        test('default', () => {
          const yupSchema = buildYupSchema({
            id: 'number',
          });

          expect(yupSchema.isValidSync({ id: 1 }))
            .toEqual(true);
          expect(yupSchema.isValidSync({ id: '1' }))
            .toEqual(true);
          expect(yupSchema.isValidSync())
            .toEqual(true);
          expect(yupSchema.isValidSync({ id: true }))
            .toEqual(false);
        });
        test('required', () => {
          const yupSchema = buildYupSchema({
            id: {
              type: 'number',
              required: true,
            },
          });

          expect(yupSchema.isValidSync({ id: 1 }))
            .toEqual(true);
          expect(yupSchema.isValidSync())
            .toEqual(false);
        });
        test('min/max', () => {
          const yupSchema = buildYupSchema({
            id: {
              type: 'number',
              required: true,
              min: 3,
              max: 5,
            },
          });

          expect(yupSchema.isValidSync({ id: 2 }))
            .toEqual(false);
          expect(yupSchema.isValidSync({ id: 4 }))
            .toEqual(true);
          expect(yupSchema.isValidSync({ id: 6 }))
            .toEqual(false);
        });
      });

      describe('object', () => {
        test('default', () => {
          const yupSchema = buildYupSchema({
            location: {
              type: 'object',
              shape: {
                address: {
                  type: 'string',
                },
                latitude: {
                  type: 'number',
                  required: true,
                },
                longitude: {
                  type: 'number',
                  required: true,
                },
              },
            },
          });

          expect(yupSchema.isValidSync({
            location: {
              address: 'Trg republike 1а, Beograd 104303',
              latitude: 44.8167441,
              longitude: 20.4577252,
            },
          }))
            .toEqual(true);
          expect(yupSchema.isValidSync({
            location: {
              latitude: 44.8167441,
              longitude: 20.4577252,
            },
          }))
            .toEqual(true);
          expect(yupSchema.isValidSync({
            location: {
              longitude: 20.4577252,
            },
          }))
            .toEqual(false);
        });
      });

      describe('string', () => {
        test('default', () => {
          const yupSchema = buildYupSchema({
            username: 'string',
          });

          expect(yupSchema.isValidSync({ username: 'petar' }))
            .toEqual(true);
          expect(yupSchema.isValidSync())
            .toEqual(true);
        });
        test('required', () => {
          const yupSchema = buildYupSchema({
            username: {
              type: 'string',
              required: true,
            },
          });

          expect(yupSchema.isValidSync({ username: 'petar' }))
            .toEqual(true);
          expect(yupSchema.isValidSync())
            .toEqual(false);
        });
        test('min/max', () => {
          const yupSchema = buildYupSchema({
            username: {
              type: 'string',
              required: true,
              min: 8,
              max: 12,
            },
          });

          expect(yupSchema.isValidSync({ username: 'petar' }))
            .toEqual(false);
          expect(yupSchema.isValidSync({ username: 'petar1983' }))
            .toEqual(true);
          expect(yupSchema.isValidSync({ username: 'petarvudragovic' }))
            .toEqual(false);
        });
        test('email', () => {
          const yupSchema = buildYupSchema({
            email: {
              type: 'string',
              email: true,
            },
          });

          expect(yupSchema.isValidSync({ email: 'petar@quintaessentia.rs' }))
            .toEqual(true);
          expect(yupSchema.isValidSync({ email: 'petar@quintaessentia' }))
            .toEqual(false);
        });
      });
    });
  });
});
