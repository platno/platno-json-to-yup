import forEach from 'lodash/forEach';
import head from 'lodash/head';
import includes from 'lodash/includes';
import isBoolean from 'lodash/isBoolean';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined';
import keys from 'lodash/keys';
import mapValues from 'lodash/mapValues';
import reduce from 'lodash/reduce';
import toString from 'lodash/toString';
import values from 'lodash/values';

import * as Yup from 'yup';

const YupTypesNames = {
  ARRAY: 'array',
  BOOLEAN: 'boolean',
  DATE: 'date',
  MIXED: 'mixed',
  NUMBER: 'number',
  OBJECT: 'object',
  STRING: 'string',
};

const isYupType = (value) => includes(values(YupTypesNames), value);

const getNormalizedConfig = (config) => {
  if (isString(config)) {
    if (isYupType(config)) {
      return {
        type: config,
      };
    }

    throw new Error(`Type ${config} is not valid type.`);
  }

  if (isPlainObject(config)) {
    if (isYupType(config.type)) {
      const methods = reduce(
        config,
        (result, value, key) => {
          if (key !== 'type') {
            result.push({
              name: key,
              args: value,
            });
          }

          return result;
        },
        [],
      );

      return {
        type: config.type,
        methods,
      };
    }

    throw new Error(`Type ${config.type} is not valid type.`);
  }

  throw new Error(`Invalid configuration (${toString(config)})`);
};

const getYupType = ({ type }) => {
  switch (type) {
    case YupTypesNames.ARRAY: return Yup.array();
    case YupTypesNames.BOOLEAN: return Yup.boolean();
    case YupTypesNames.DATE: return Yup.date();
    case YupTypesNames.MIXED: return Yup.mixed();
    case YupTypesNames.NUMBER: return Yup.number();
    case YupTypesNames.OBJECT: return Yup.object();
    case YupTypesNames.STRING: return Yup.string();
    default: throw new Error(`Type ${type} is not valid type.`);
  }
};

const applayMethodWhen = (base, args) => {
  const fieldName = head(keys(args));

  const {
    is,
    then,
    otherwise,
  } = args[fieldName];

  if (isUndefined(is)) {
    throw new Error('Invalid configuration, property "is" is required in "when" method');
  }

  if (isUndefined(then)) {
    throw new Error('Invalid configuration, property "then" is required in "when" method');
  }

  if (isUndefined(otherwise)) {
    throw new Error('Invalid configuration, property "otherwise" is required in "when" method');
  }

  return base.when(
    fieldName,
    {
      is,
      then: getYupSchema(then),
      otherwise: getYupSchema(otherwise),
    },
  );
};

const applayMethodShape = (base, args) => base.shape(mapValues(args, getYupSchema));

const applyMethodsOnType = (base, typeName, methods) => {
  let baseType = base;

  forEach(
    methods,
    ({ name, args }) => {
      if (isFunction(base[name])) {
        switch (name) {
          case 'when':
            baseType = applayMethodWhen(baseType, args);
            break;
          case 'shape':
            baseType = applayMethodShape(baseType, args);
            break;
          default:
            if (isBoolean(args)) {
              if (args) {
                baseType = baseType[name](args);
              }
            } else {
              baseType = baseType[name](args);
            }
            break;
        }
      } else {
        throw new Error(`Invalid method ${name} on ${typeName} type`);
      }
    },
  );

  return baseType;
};

const getYupSchema = (config) => {
  const normalizedConfig = getNormalizedConfig(config);

  return applyMethodsOnType(
    getYupType(normalizedConfig),
    normalizedConfig.type,
    normalizedConfig.methods,
  );
};

const buildYupSchema = (config) => Yup.object().shape(
  mapValues(config, getYupSchema),
);

export {
  Yup,
  YupTypesNames,
  isYupType,
  getNormalizedConfig,
  getYupType,
  applyMethodsOnType,
  getYupSchema,
  buildYupSchema,
};
