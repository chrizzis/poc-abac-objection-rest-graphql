const isSubset = (superObj, subObj) => {
  return Object.keys(subObj).every(ele => {
    if (typeof subObj[ele] == 'object') {
      return isSubset(superObj[ele], subObj[ele]);
    }
    if (typeof superObj[ele] == "boolean" && typeof subObj[ele] != "boolean") {
      const subBool = (subObj[ele] === 'true')
      return subBool == superObj[ele]
    } else if (typeof superObj[ele] == "number" && typeof superObj[ele] != "number") {
      return +subObj[ele] == superObj[ele]
    }
    return subObj[ele] == superObj[ele]
  });
};

const isValidCondition = (condition) => {
  for (const prop of Object.values(condition)) {
    if (!['string', 'boolean', 'number'].includes(typeof prop)) {
      return false
    }
  }
  return true
}
/*
 TODO: acl.$and not TDD or implemented, TDD needed
{
  "$and": [
    {
      "$not": {
        "published": false
      }
    }
  ],
  "$or": [
    {
      "published": true
    }
  ]
}
*/
/**
 * Given request conditions and optional acl conditions:
 * returns an array of clauses that can be consumed by Objection
 * 
 * Constraints: if there are 'and' and 'or' conditions, will 'and' them together with the 'or's as a subquery,
 *  else just where.andWhere... or where.orWhere...
 * 
 * TODO: for now, just support equality (https://casl.js.org/v5/en/guide/aclConditionss-in-depth)
 * @param {$limitOr?, $and?, $or?} reqConditions 
 * @param {$and?, $or?} aclConditions - optional (casl:rulesToQuery)
 * @returns Array of clauses that can be consumed by Objection models
 * @throws 400 ValidationError if reqConditions are invalid:
 *   req.limitOr not a subset of acl.or
 *   req conditions not k:v where v != boolean|string|number
 */
const toWhereArray = (reqConditions, aclConditions = {}) => {
  const mergedFilters = []
  const { $and = [], $or = [] } = aclConditions
  let mergedAnd = {}
  let mergedOr = {}

  if ($and.length)
    console.error(`TODO: TDD: utils.interpret - $and!`)

  for (const [key, value] of Object.entries(reqConditions)) {
    if (!isValidCondition(value)) {
      // TODO: ValidationError(400)
      throw new Error('validation')
    }
  }

  if (!$and.length && !$or.length) {
    mergedAnd = { ...reqConditions.$and, ...reqConditions.$limitOr }
    mergedOr = { ...reqConditions.$or }
  } else {
    // TODO: TDD on implementation
    // if ($and.length) {
    //   $and.forEach(clause => {
    //     if (!clause.$not) {
    //       mergedAnd = { ...mergedAnd, ...clause }
    //     } else {
    //       console.error(`TODO: utils.interpret - $and.$not (acl.forbid)!`)
    //     }
    //   })
    // }
    mergedAnd = { ...mergedAnd, ...reqConditions.$and }

    if ($or.length) {
      $or.forEach(clause => {
        // TODO: aclConditions.foo = bar and reqConditions.foo = baz -> data mangled
        mergedOr = { ...mergedOr, ...clause }
      })
      if (reqConditions.$limitOr && Object.keys(reqConditions.$limitOr).length) {
        if (isSubset(mergedOr, reqConditions.$limitOr)) {
          mergedOr = { ...reqConditions.$limitOr }
        } else {
          console.error(`TODO: TDD: utils.interpret - limit not subset of acl!`)
        }
      }
    } else {
      mergedAnd = { ...mergedAnd, ...reqConditions.$limitOr }
    }
    mergedOr = { ...mergedOr, ...reqConditions.$or }
  }

  if (Object.keys(mergedAnd).length) {
    let subquery = []
    for (const [key, value] of Object.entries(mergedOr)) {
      if (mergedAnd[key]) {
        console.error(`TODO: duplicate key for and/or detected! for now defaulting to mergedAnd`)
        continue
      }
      const clause = subquery.length ? 'orWhere' : 'where'
      subquery.push({ [clause]: { [key]: value } })
    }
    if (subquery.length > 1) {
      mergedFilters.push({ where: mergedAnd })
      mergedFilters.push({ ['andWhere']: subquery })
    } else if (subquery.length) {
      mergedAnd = { ...mergedAnd, ...subquery[0].where }
      mergedFilters.push({ where: mergedAnd })
    } else {
      mergedFilters.push({ where: mergedAnd })
    }
  } else {
    for (const [key, value] of Object.entries(mergedOr)) {
      const clause = mergedFilters.length ? 'orWhere' : 'where'
      mergedFilters.push({ [clause]: { [key]: value } })
    }
  }
  return mergedFilters
}

export default toWhereArray 