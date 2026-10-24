(function (root) {
  "use strict";

  const DRAW_SIZE = 12;
  const data = root.OPERATOR_DATA;
  const PROFESSIONS = data.professions;
  const OPERATORS_BY_PROFESSION = data.operators;
  const MAXIMUM_LIMITS = Object.freeze({ "医疗": 2 });
  const ALL_OPERATORS = PROFESSIONS.flatMap((profession) =>
    OPERATORS_BY_PROFESSION[profession].map(([name, rarity]) => ({
      name,
      rarity,
      profession
    }))
  );

  function getRandomInt(max) {
    if (!Number.isSafeInteger(max) || max <= 0) {
      throw new RangeError("随机数范围必须为正整数");
    }

    if (root.crypto && root.crypto.getRandomValues) {
      const limit = Math.floor(0x100000000 / max) * max;
      const values = new Uint32Array(1);
      do {
        root.crypto.getRandomValues(values);
      } while (values[0] >= limit);
      return values[0] % max;
    }

    return Math.floor(Math.random() * max);
  }

  function shuffle(items) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = getRandomInt(i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function shuffledProfessionPool(profession, usedNames) {
    return shuffle(
      OPERATORS_BY_PROFESSION[profession]
        .filter(([name]) => !usedNames.has(name))
        .map(([name, rarity]) => ({ name, rarity, profession }))
    );
  }

  function validateConstraints(minimums, maximums, unique) {
    const totalMin = Object.values(minimums).reduce((sum, value) => sum + value, 0);
    let totalCapacity = 0;

    if (totalMin > DRAW_SIZE) {
      return `职业下限合计为 ${totalMin}，超过了 ${DRAW_SIZE} 个名额。`;
    }

    for (const profession of PROFESSIONS) {
      const available = unique
        ? OPERATORS_BY_PROFESSION[profession].length
        : Infinity;
      const min = minimums[profession];
      const max = maximums[profession];
      const maxLimit = MAXIMUM_LIMITS[profession] ?? DRAW_SIZE;

      if (max > maxLimit) {
        return `${profession}最多只能选择 ${maxLimit} 名。`;
      }

      if (min > max) {
        return `${profession}的最低人数不能高于最高人数。`;
      }

      if (min > available) {
        return `${profession}候选池只有 ${available} 名干员，无法达到下限 ${min}。`;
      }

      totalCapacity += Math.min(max, available);
    }

    if (totalCapacity < DRAW_SIZE) {
      return `所有职业的最高人数合计不足，无法凑齐 ${DRAW_SIZE} 名干员。`;
    }

    return "";
  }

  function drawOperators(minimums, maximums, unique, drawSize = DRAW_SIZE) {
    const error = validateConstraints(minimums, maximums, unique);
    if (error) {
      throw new Error(error);
    }

    if (!Number.isSafeInteger(drawSize) || drawSize < 1) {
      throw new RangeError("抽取数量必须为正整数");
    }

    const results = [];
    const usedNames = new Set();
    const professionCounts = Object.fromEntries(PROFESSIONS.map((profession) => [profession, 0]));
    const quotaProfessions = shuffle(PROFESSIONS.filter((profession) => minimums[profession] > 0));

    if (!unique) {
      for (const profession of quotaProfessions) {
        const candidates = OPERATORS_BY_PROFESSION[profession];
        for (let index = 0; index < minimums[profession]; index += 1) {
          const [name, rarity] = candidates[getRandomInt(candidates.length)];
          results.push({ name, rarity, profession });
          professionCounts[profession] += 1;
        }
      }

      while (results.length < drawSize) {
        const eligible = ALL_OPERATORS.filter(
          (operator) => professionCounts[operator.profession] < maximums[operator.profession]
        );
        if (eligible.length === 0) {
          throw new Error("职业最高人数限制过紧，无法完成本次抽取。");
        }
        const operator = eligible[getRandomInt(eligible.length)];
        results.push(operator);
        professionCounts[operator.profession] += 1;
      }
      return shuffle(results);
    }

    for (const profession of quotaProfessions) {
      const candidates = shuffledProfessionPool(profession, usedNames);
      const count = Math.min(minimums[profession], candidates.length);
      for (let index = 0; index < count; index += 1) {
        results.push(candidates[index]);
        usedNames.add(candidates[index].name);
        professionCounts[profession] += 1;
      }
    }

    while (results.length < drawSize) {
      const remainingPool = ALL_OPERATORS.filter(
        (operator) =>
          !usedNames.has(operator.name) &&
          professionCounts[operator.profession] < maximums[operator.profession]
      );
      if (remainingPool.length === 0) {
        throw new Error("职业最高人数限制过紧，无法完成本次抽取。");
      }

      const operator = remainingPool[getRandomInt(remainingPool.length)];
      results.push(operator);
      usedNames.add(operator.name);
      professionCounts[operator.profession] += 1;
    }

    return shuffle(results).slice(0, drawSize);
  }

  root.RecruitEngine = Object.freeze({
    DRAW_SIZE,
    PROFESSIONS,
    OPERATORS_BY_PROFESSION,
    ALL_OPERATORS,
    MAXIMUM_LIMITS,
    drawOperators,
    validateConstraints
  });
})(typeof window !== "undefined" ? window : globalThis);
