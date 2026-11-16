// node_modules/.pnpm/diff-match-patch-es@1.0.1/node_modules/diff-match-patch-es/dist/index.mjs
var defaultOptions = Object.freeze({
  diffTimeout: 1,
  diffEditCost: 4,
  matchThreshold: 0.5,
  matchDistance: 1e3,
  patchDeleteThreshold: 0.5,
  patchMargin: 4,
  matchMaxBits: 32
});
function resolveOptions(options) {
  if (options?.__resolved)
    return options;
  const resolved = {
    ...defaultOptions,
    ...options
  };
  Object.defineProperty(resolved, "__resolved", { value: true, enumerable: false });
  return resolved;
}
var DIFF_DELETE = -1;
var DIFF_INSERT = 1;
var DIFF_EQUAL = 0;
function createDiff(op, text) {
  return [op, text];
}
function diffMain(text1, text2, options, opt_checklines = true, opt_deadline) {
  const resolved = resolveOptions(options);
  if (typeof opt_deadline == "undefined") {
    if (resolved.diffTimeout <= 0)
      opt_deadline = Number.MAX_VALUE;
    else
      opt_deadline = (/* @__PURE__ */ new Date()).getTime() + resolved.diffTimeout * 1e3;
  }
  const deadline = opt_deadline;
  if (text1 == null || text2 == null)
    throw new Error("Null input. (diff_main)");
  if (text1 === text2) {
    if (text1)
      return [createDiff(DIFF_EQUAL, text1)];
    return [];
  }
  const checklines = opt_checklines;
  let commonlength = diffCommonPrefix(text1, text2);
  const commonprefix = text1.substring(0, commonlength);
  text1 = text1.substring(commonlength);
  text2 = text2.substring(commonlength);
  commonlength = diffCommonSuffix(text1, text2);
  const commonsuffix = text1.substring(text1.length - commonlength);
  text1 = text1.substring(0, text1.length - commonlength);
  text2 = text2.substring(0, text2.length - commonlength);
  const diffs = diffCompute(text1, text2, resolved, checklines, deadline);
  if (commonprefix)
    diffs.unshift(createDiff(DIFF_EQUAL, commonprefix));
  if (commonsuffix)
    diffs.push(createDiff(DIFF_EQUAL, commonsuffix));
  diffCleanupMerge(diffs);
  return diffs;
}
function diffCompute(text1, text2, options, checklines, deadline) {
  let diffs;
  if (!text1) {
    return [createDiff(DIFF_INSERT, text2)];
  }
  if (!text2) {
    return [createDiff(DIFF_DELETE, text1)];
  }
  const longtext = text1.length > text2.length ? text1 : text2;
  const shorttext = text1.length > text2.length ? text2 : text1;
  const i = longtext.indexOf(shorttext);
  if (i !== -1) {
    diffs = [createDiff(DIFF_INSERT, longtext.substring(0, i)), createDiff(DIFF_EQUAL, shorttext), createDiff(DIFF_INSERT, longtext.substring(i + shorttext.length))];
    if (text1.length > text2.length)
      diffs[0][0] = diffs[2][0] = DIFF_DELETE;
    return diffs;
  }
  if (shorttext.length === 1) {
    return [createDiff(DIFF_DELETE, text1), createDiff(DIFF_INSERT, text2)];
  }
  const hm = diffHalfMatch(text1, text2, options);
  if (hm) {
    const text1_a = hm[0];
    const text1_b = hm[1];
    const text2_a = hm[2];
    const text2_b = hm[3];
    const mid_common = hm[4];
    const diffs_a = diffMain(text1_a, text2_a, options, checklines, deadline);
    const diffs_b = diffMain(text1_b, text2_b, options, checklines, deadline);
    return diffs_a.concat([createDiff(DIFF_EQUAL, mid_common)], diffs_b);
  }
  if (checklines && text1.length > 100 && text2.length > 100)
    return diffLineMode(text1, text2, options, deadline);
  return diffBisect(text1, text2, options, deadline);
}
function diffLineMode(text1, text2, options, deadline) {
  const a = diffLinesToChars(text1, text2);
  text1 = a.chars1;
  text2 = a.chars2;
  const linearray = a.lineArray;
  const diffs = diffMain(text1, text2, options, false, deadline);
  diffCharsToLines(diffs, linearray);
  diffCleanupSemantic(diffs);
  diffs.push(createDiff(DIFF_EQUAL, ""));
  let pointer = 0;
  let count_delete = 0;
  let count_insert = 0;
  let text_delete = "";
  let text_insert = "";
  while (pointer < diffs.length) {
    switch (diffs[pointer][0]) {
      case DIFF_INSERT:
        count_insert++;
        text_insert += diffs[pointer][1];
        break;
      case DIFF_DELETE:
        count_delete++;
        text_delete += diffs[pointer][1];
        break;
      case DIFF_EQUAL:
        if (count_delete >= 1 && count_insert >= 1) {
          diffs.splice(pointer - count_delete - count_insert, count_delete + count_insert);
          pointer = pointer - count_delete - count_insert;
          const subDiff = diffMain(text_delete, text_insert, options, false, deadline);
          for (let j = subDiff.length - 1; j >= 0; j--)
            diffs.splice(pointer, 0, subDiff[j]);
          pointer = pointer + subDiff.length;
        }
        count_insert = 0;
        count_delete = 0;
        text_delete = "";
        text_insert = "";
        break;
    }
    pointer++;
  }
  diffs.pop();
  return diffs;
}
function diffBisect(text1, text2, options, deadline) {
  const text1_length = text1.length;
  const text2_length = text2.length;
  const max_d = Math.ceil((text1_length + text2_length) / 2);
  const v_offset = max_d;
  const v_length = 2 * max_d;
  const v1 = new Array(v_length);
  const v2 = new Array(v_length);
  for (let x = 0; x < v_length; x++) {
    v1[x] = -1;
    v2[x] = -1;
  }
  v1[v_offset + 1] = 0;
  v2[v_offset + 1] = 0;
  const delta = text1_length - text2_length;
  const front = delta % 2 !== 0;
  let k1start = 0;
  let k1end = 0;
  let k2start = 0;
  let k2end = 0;
  for (let d = 0; d < max_d; d++) {
    if ((/* @__PURE__ */ new Date()).getTime() > deadline)
      break;
    for (let k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
      const k1_offset = v_offset + k1;
      let x1;
      if (k1 === -d || k1 !== d && v1[k1_offset - 1] < v1[k1_offset + 1])
        x1 = v1[k1_offset + 1];
      else
        x1 = v1[k1_offset - 1] + 1;
      let y1 = x1 - k1;
      while (x1 < text1_length && y1 < text2_length && text1.charAt(x1) === text2.charAt(y1)) {
        x1++;
        y1++;
      }
      v1[k1_offset] = x1;
      if (x1 > text1_length) {
        k1end += 2;
      } else if (y1 > text2_length) {
        k1start += 2;
      } else if (front) {
        const k2_offset = v_offset + delta - k1;
        if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] !== -1) {
          const x2 = text1_length - v2[k2_offset];
          if (x1 >= x2) {
            return diffBisectSplit(text1, text2, options, x1, y1, deadline);
          }
        }
      }
    }
    for (let k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
      const k2_offset = v_offset + k2;
      let x2;
      if (k2 === -d || k2 !== d && v2[k2_offset - 1] < v2[k2_offset + 1])
        x2 = v2[k2_offset + 1];
      else
        x2 = v2[k2_offset - 1] + 1;
      let y2 = x2 - k2;
      while (x2 < text1_length && y2 < text2_length && text1.charAt(text1_length - x2 - 1) === text2.charAt(text2_length - y2 - 1)) {
        x2++;
        y2++;
      }
      v2[k2_offset] = x2;
      if (x2 > text1_length) {
        k2end += 2;
      } else if (y2 > text2_length) {
        k2start += 2;
      } else if (!front) {
        const k1_offset = v_offset + delta - k2;
        if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] !== -1) {
          const x1 = v1[k1_offset];
          const y1 = v_offset + x1 - k1_offset;
          x2 = text1_length - x2;
          if (x1 >= x2) {
            return diffBisectSplit(text1, text2, options, x1, y1, deadline);
          }
        }
      }
    }
  }
  return [createDiff(DIFF_DELETE, text1), createDiff(DIFF_INSERT, text2)];
}
function diffBisectSplit(text1, text2, options, x, y, deadline) {
  const text1a = text1.substring(0, x);
  const text2a = text2.substring(0, y);
  const text1b = text1.substring(x);
  const text2b = text2.substring(y);
  const diffs = diffMain(text1a, text2a, options, false, deadline);
  const diffsb = diffMain(text1b, text2b, options, false, deadline);
  return diffs.concat(diffsb);
}
function diffLinesToChars(text1, text2) {
  const lineArray = [];
  const lineHash = {};
  let maxLines = 4e4;
  lineArray[0] = "";
  function diffLinesToCharsMunge(text) {
    let chars = "";
    let lineStart = 0;
    let lineEnd = -1;
    let lineArrayLength = lineArray.length;
    while (lineEnd < text.length - 1) {
      lineEnd = text.indexOf("\n", lineStart);
      if (lineEnd === -1)
        lineEnd = text.length - 1;
      let line = text.substring(lineStart, lineEnd + 1);
      if (lineHash.hasOwnProperty ? Object.prototype.hasOwnProperty.call(lineHash, line) : lineHash[line] !== void 0) {
        chars += String.fromCharCode(lineHash[line]);
      } else {
        if (lineArrayLength === maxLines) {
          line = text.substring(lineStart);
          lineEnd = text.length;
        }
        chars += String.fromCharCode(lineArrayLength);
        lineHash[line] = lineArrayLength;
        lineArray[lineArrayLength++] = line;
      }
      lineStart = lineEnd + 1;
    }
    return chars;
  }
  const chars1 = diffLinesToCharsMunge(text1);
  maxLines = 65535;
  const chars2 = diffLinesToCharsMunge(text2);
  return { chars1, chars2, lineArray };
}
function diffCharsToLines(diffs, lineArray) {
  for (let i = 0; i < diffs.length; i++) {
    const chars = diffs[i][1];
    const text = [];
    for (let j = 0; j < chars.length; j++)
      text[j] = lineArray[chars.charCodeAt(j)];
    diffs[i][1] = text.join("");
  }
}
function diffCommonPrefix(text1, text2) {
  if (!text1 || !text2 || text1.charAt(0) !== text2.charAt(0))
    return 0;
  let pointermin = 0;
  let pointermax = Math.min(text1.length, text2.length);
  let pointermid = pointermax;
  let pointerstart = 0;
  while (pointermin < pointermid) {
    if (text1.substring(pointerstart, pointermid) === text2.substring(pointerstart, pointermid)) {
      pointermin = pointermid;
      pointerstart = pointermin;
    } else {
      pointermax = pointermid;
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }
  return pointermid;
}
function diffCommonSuffix(text1, text2) {
  if (!text1 || !text2 || text1.charAt(text1.length - 1) !== text2.charAt(text2.length - 1)) {
    return 0;
  }
  let pointermin = 0;
  let pointermax = Math.min(text1.length, text2.length);
  let pointermid = pointermax;
  let pointerend = 0;
  while (pointermin < pointermid) {
    if (text1.substring(text1.length - pointermid, text1.length - pointerend) === text2.substring(text2.length - pointermid, text2.length - pointerend)) {
      pointermin = pointermid;
      pointerend = pointermin;
    } else {
      pointermax = pointermid;
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }
  return pointermid;
}
function diffCommonOverlap(text1, text2) {
  const text1_length = text1.length;
  const text2_length = text2.length;
  if (text1_length === 0 || text2_length === 0)
    return 0;
  if (text1_length > text2_length)
    text1 = text1.substring(text1_length - text2_length);
  else if (text1_length < text2_length)
    text2 = text2.substring(0, text1_length);
  const text_length = Math.min(text1_length, text2_length);
  if (text1 === text2)
    return text_length;
  let best = 0;
  let length = 1;
  while (true) {
    const pattern = text1.substring(text_length - length);
    const found = text2.indexOf(pattern);
    if (found === -1)
      return best;
    length += found;
    if (found === 0 || text1.substring(text_length - length) === text2.substring(0, length)) {
      best = length;
      length++;
    }
  }
}
function diffHalfMatch(text1, text2, options) {
  if (options.diffTimeout <= 0) {
    return null;
  }
  const longtext = text1.length > text2.length ? text1 : text2;
  const shorttext = text1.length > text2.length ? text2 : text1;
  if (longtext.length < 4 || shorttext.length * 2 < longtext.length)
    return null;
  function diffHalfMatchI(longtext2, shorttext2, i) {
    const seed = longtext2.substring(i, i + Math.floor(longtext2.length / 4));
    let j = -1;
    let best_common = "";
    let best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;
    while ((j = shorttext2.indexOf(seed, j + 1)) !== -1) {
      const prefixLength = diffCommonPrefix(longtext2.substring(i), shorttext2.substring(j));
      const suffixLength = diffCommonSuffix(longtext2.substring(0, i), shorttext2.substring(0, j));
      if (best_common.length < suffixLength + prefixLength) {
        best_common = shorttext2.substring(j - suffixLength, j) + shorttext2.substring(j, j + prefixLength);
        best_longtext_a = longtext2.substring(0, i - suffixLength);
        best_longtext_b = longtext2.substring(i + prefixLength);
        best_shorttext_a = shorttext2.substring(0, j - suffixLength);
        best_shorttext_b = shorttext2.substring(j + prefixLength);
      }
    }
    if (best_common.length * 2 >= longtext2.length)
      return [best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b, best_common];
    else
      return null;
  }
  const hm1 = diffHalfMatchI(longtext, shorttext, Math.ceil(longtext.length / 4));
  const hm2 = diffHalfMatchI(longtext, shorttext, Math.ceil(longtext.length / 2));
  let hm;
  if (!hm1 && !hm2) {
    return null;
  } else if (!hm2) {
    hm = hm1;
  } else if (!hm1) {
    hm = hm2;
  } else {
    hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
  }
  let text1_a, text1_b, text2_a, text2_b;
  if (text1.length > text2.length) {
    text1_a = hm[0];
    text1_b = hm[1];
    text2_a = hm[2];
    text2_b = hm[3];
  } else {
    text2_a = hm[0];
    text2_b = hm[1];
    text1_a = hm[2];
    text1_b = hm[3];
  }
  const mid_common = hm[4];
  return [text1_a, text1_b, text2_a, text2_b, mid_common];
}
function diffCleanupSemantic(diffs) {
  let changes = false;
  const equalities = [];
  let equalitiesLength = 0;
  let lastEquality = null;
  let pointer = 0;
  let length_insertions1 = 0;
  let length_deletions1 = 0;
  let length_insertions2 = 0;
  let length_deletions2 = 0;
  while (pointer < diffs.length) {
    if (diffs[pointer][0] === DIFF_EQUAL) {
      equalities[equalitiesLength++] = pointer;
      length_insertions1 = length_insertions2;
      length_deletions1 = length_deletions2;
      length_insertions2 = 0;
      length_deletions2 = 0;
      lastEquality = diffs[pointer][1];
    } else {
      if (diffs[pointer][0] === DIFF_INSERT)
        length_insertions2 += diffs[pointer][1].length;
      else
        length_deletions2 += diffs[pointer][1].length;
      if (lastEquality && lastEquality.length <= Math.max(length_insertions1, length_deletions1) && lastEquality.length <= Math.max(length_insertions2, length_deletions2)) {
        diffs.splice(equalities[equalitiesLength - 1], 0, createDiff(DIFF_DELETE, lastEquality));
        diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
        equalitiesLength--;
        equalitiesLength--;
        pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;
        length_insertions1 = 0;
        length_deletions1 = 0;
        length_insertions2 = 0;
        length_deletions2 = 0;
        lastEquality = null;
        changes = true;
      }
    }
    pointer++;
  }
  if (changes)
    diffCleanupMerge(diffs);
  diffCleanupSemanticLossless(diffs);
  pointer = 1;
  while (pointer < diffs.length) {
    if (diffs[pointer - 1][0] === DIFF_DELETE && diffs[pointer][0] === DIFF_INSERT) {
      const deletion = diffs[pointer - 1][1];
      const insertion = diffs[pointer][1];
      const overlap_length1 = diffCommonOverlap(deletion, insertion);
      const overlap_length2 = diffCommonOverlap(insertion, deletion);
      if (overlap_length1 >= overlap_length2) {
        if (overlap_length1 >= deletion.length / 2 || overlap_length1 >= insertion.length / 2) {
          diffs.splice(pointer, 0, createDiff(DIFF_EQUAL, insertion.substring(0, overlap_length1)));
          diffs[pointer - 1][1] = deletion.substring(0, deletion.length - overlap_length1);
          diffs[pointer + 1][1] = insertion.substring(overlap_length1);
          pointer++;
        }
      } else {
        if (overlap_length2 >= deletion.length / 2 || overlap_length2 >= insertion.length / 2) {
          diffs.splice(pointer, 0, createDiff(DIFF_EQUAL, deletion.substring(0, overlap_length2)));
          diffs[pointer - 1][0] = DIFF_INSERT;
          diffs[pointer - 1][1] = insertion.substring(0, insertion.length - overlap_length2);
          diffs[pointer + 1][0] = DIFF_DELETE;
          diffs[pointer + 1][1] = deletion.substring(overlap_length2);
          pointer++;
        }
      }
      pointer++;
    }
    pointer++;
  }
}
var nonAlphaNumericRegex_ = /[^a-z0-9]/i;
var whitespaceRegex_ = /\s/;
var linebreakRegex_ = /[\r\n]/;
var blanklineEndRegex_ = /\n\r?\n$/;
var blanklineStartRegex_ = /^\r?\n\r?\n/;
function diffCleanupSemanticLossless(diffs) {
  function diffCleanupSemanticScore(one, two) {
    if (!one || !two) {
      return 6;
    }
    const char1 = one.charAt(one.length - 1);
    const char2 = two.charAt(0);
    const nonAlphaNumeric1 = char1.match(nonAlphaNumericRegex_);
    const nonAlphaNumeric2 = char2.match(nonAlphaNumericRegex_);
    const whitespace1 = nonAlphaNumeric1 && char1.match(whitespaceRegex_);
    const whitespace2 = nonAlphaNumeric2 && char2.match(whitespaceRegex_);
    const lineBreak1 = whitespace1 && char1.match(linebreakRegex_);
    const lineBreak2 = whitespace2 && char2.match(linebreakRegex_);
    const blankLine1 = lineBreak1 && one.match(blanklineEndRegex_);
    const blankLine2 = lineBreak2 && two.match(blanklineStartRegex_);
    if (blankLine1 || blankLine2) {
      return 5;
    } else if (lineBreak1 || lineBreak2) {
      return 4;
    } else if (nonAlphaNumeric1 && !whitespace1 && whitespace2) {
      return 3;
    } else if (whitespace1 || whitespace2) {
      return 2;
    } else if (nonAlphaNumeric1 || nonAlphaNumeric2) {
      return 1;
    }
    return 0;
  }
  let pointer = 1;
  while (pointer < diffs.length - 1) {
    if (diffs[pointer - 1][0] === DIFF_EQUAL && diffs[pointer + 1][0] === DIFF_EQUAL) {
      let equality1 = diffs[pointer - 1][1];
      let edit = diffs[pointer][1];
      let equality2 = diffs[pointer + 1][1];
      const commonOffset = diffCommonSuffix(equality1, edit);
      if (commonOffset) {
        const commonString = edit.substring(edit.length - commonOffset);
        equality1 = equality1.substring(0, equality1.length - commonOffset);
        edit = commonString + edit.substring(0, edit.length - commonOffset);
        equality2 = commonString + equality2;
      }
      let bestEquality1 = equality1;
      let bestEdit = edit;
      let bestEquality2 = equality2;
      let bestScore = diffCleanupSemanticScore(equality1, edit) + diffCleanupSemanticScore(edit, equality2);
      while (edit.charAt(0) === equality2.charAt(0)) {
        equality1 += edit.charAt(0);
        edit = edit.substring(1) + equality2.charAt(0);
        equality2 = equality2.substring(1);
        const score = diffCleanupSemanticScore(equality1, edit) + diffCleanupSemanticScore(edit, equality2);
        if (score >= bestScore) {
          bestScore = score;
          bestEquality1 = equality1;
          bestEdit = edit;
          bestEquality2 = equality2;
        }
      }
      if (diffs[pointer - 1][1] !== bestEquality1) {
        if (bestEquality1) {
          diffs[pointer - 1][1] = bestEquality1;
        } else {
          diffs.splice(pointer - 1, 1);
          pointer--;
        }
        diffs[pointer][1] = bestEdit;
        if (bestEquality2) {
          diffs[pointer + 1][1] = bestEquality2;
        } else {
          diffs.splice(pointer + 1, 1);
          pointer--;
        }
      }
    }
    pointer++;
  }
}
function diffCleanupMerge(diffs) {
  diffs.push(createDiff(DIFF_EQUAL, ""));
  let pointer = 0;
  let count_delete = 0;
  let count_insert = 0;
  let text_delete = "";
  let text_insert = "";
  let commonlength;
  while (pointer < diffs.length) {
    switch (diffs[pointer][0]) {
      case DIFF_INSERT:
        count_insert++;
        text_insert += diffs[pointer][1];
        pointer++;
        break;
      case DIFF_DELETE:
        count_delete++;
        text_delete += diffs[pointer][1];
        pointer++;
        break;
      case DIFF_EQUAL:
        if (count_delete + count_insert > 1) {
          if (count_delete !== 0 && count_insert !== 0) {
            commonlength = diffCommonPrefix(text_insert, text_delete);
            if (commonlength !== 0) {
              if (pointer - count_delete - count_insert > 0 && diffs[pointer - count_delete - count_insert - 1][0] === DIFF_EQUAL) {
                diffs[pointer - count_delete - count_insert - 1][1] += text_insert.substring(0, commonlength);
              } else {
                diffs.splice(0, 0, createDiff(DIFF_EQUAL, text_insert.substring(0, commonlength)));
                pointer++;
              }
              text_insert = text_insert.substring(commonlength);
              text_delete = text_delete.substring(commonlength);
            }
            commonlength = diffCommonSuffix(text_insert, text_delete);
            if (commonlength !== 0) {
              diffs[pointer][1] = text_insert.substring(text_insert.length - commonlength) + diffs[pointer][1];
              text_insert = text_insert.substring(0, text_insert.length - commonlength);
              text_delete = text_delete.substring(0, text_delete.length - commonlength);
            }
          }
          pointer -= count_delete + count_insert;
          diffs.splice(pointer, count_delete + count_insert);
          if (text_delete.length) {
            diffs.splice(pointer, 0, createDiff(DIFF_DELETE, text_delete));
            pointer++;
          }
          if (text_insert.length) {
            diffs.splice(pointer, 0, createDiff(DIFF_INSERT, text_insert));
            pointer++;
          }
          pointer++;
        } else if (pointer !== 0 && diffs[pointer - 1][0] === DIFF_EQUAL) {
          diffs[pointer - 1][1] += diffs[pointer][1];
          diffs.splice(pointer, 1);
        } else {
          pointer++;
        }
        count_insert = 0;
        count_delete = 0;
        text_delete = "";
        text_insert = "";
        break;
    }
  }
  if (diffs[diffs.length - 1][1] === "")
    diffs.pop();
  let changes = false;
  pointer = 1;
  while (pointer < diffs.length - 1) {
    if (diffs[pointer - 1][0] === DIFF_EQUAL && diffs[pointer + 1][0] === DIFF_EQUAL) {
      if (diffs[pointer][1].substring(diffs[pointer][1].length - diffs[pointer - 1][1].length) === diffs[pointer - 1][1]) {
        diffs[pointer][1] = diffs[pointer - 1][1] + diffs[pointer][1].substring(0, diffs[pointer][1].length - diffs[pointer - 1][1].length);
        diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
        diffs.splice(pointer - 1, 1);
        changes = true;
      } else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) === diffs[pointer + 1][1]) {
        diffs[pointer - 1][1] += diffs[pointer + 1][1];
        diffs[pointer][1] = diffs[pointer][1].substring(diffs[pointer + 1][1].length) + diffs[pointer + 1][1];
        diffs.splice(pointer + 1, 1);
        changes = true;
      }
    }
    pointer++;
  }
  if (changes)
    diffCleanupMerge(diffs);
}

// node_modules/.pnpm/ohash@2.0.11/node_modules/ohash/dist/shared/ohash.D__AXeF1.mjs
function serialize(o) {
  return typeof o == "string" ? `'${o}'` : new c().serialize(o);
}
var c = (function() {
  class o {
    #t = /* @__PURE__ */ new Map();
    compare(t, r2) {
      const e = typeof t, n = typeof r2;
      return e === "string" && n === "string" ? t.localeCompare(r2) : e === "number" && n === "number" ? t - r2 : String.prototype.localeCompare.call(this.serialize(t, true), this.serialize(r2, true));
    }
    serialize(t, r2) {
      if (t === null) return "null";
      switch (typeof t) {
        case "string":
          return r2 ? t : `'${t}'`;
        case "bigint":
          return `${t}n`;
        case "object":
          return this.$object(t);
        case "function":
          return this.$function(t);
      }
      return String(t);
    }
    serializeObject(t) {
      const r2 = Object.prototype.toString.call(t);
      if (r2 !== "[object Object]") return this.serializeBuiltInType(r2.length < 10 ? `unknown:${r2}` : r2.slice(8, -1), t);
      const e = t.constructor, n = e === Object || e === void 0 ? "" : e.name;
      if (n !== "" && globalThis[n] === e) return this.serializeBuiltInType(n, t);
      if (typeof t.toJSON == "function") {
        const i = t.toJSON();
        return n + (i !== null && typeof i == "object" ? this.$object(i) : `(${this.serialize(i)})`);
      }
      return this.serializeObjectEntries(n, Object.entries(t));
    }
    serializeBuiltInType(t, r2) {
      const e = this["$" + t];
      if (e) return e.call(this, r2);
      if (typeof r2?.entries == "function") return this.serializeObjectEntries(t, r2.entries());
      throw new Error(`Cannot serialize ${t}`);
    }
    serializeObjectEntries(t, r2) {
      const e = Array.from(r2).sort((i, a) => this.compare(i[0], a[0]));
      let n = `${t}{`;
      for (let i = 0; i < e.length; i++) {
        const [a, l2] = e[i];
        n += `${this.serialize(a, true)}:${this.serialize(l2)}`, i < e.length - 1 && (n += ",");
      }
      return n + "}";
    }
    $object(t) {
      let r2 = this.#t.get(t);
      return r2 === void 0 && (this.#t.set(t, `#${this.#t.size}`), r2 = this.serializeObject(t), this.#t.set(t, r2)), r2;
    }
    $function(t) {
      const r2 = Function.prototype.toString.call(t);
      return r2.slice(-15) === "[native code] }" ? `${t.name || ""}()[native]` : `${t.name}(${t.length})${r2.replace(/\s*\n\s*/g, "")}`;
    }
    $Array(t) {
      let r2 = "[";
      for (let e = 0; e < t.length; e++) r2 += this.serialize(t[e]), e < t.length - 1 && (r2 += ",");
      return r2 + "]";
    }
    $Date(t) {
      try {
        return `Date(${t.toISOString()})`;
      } catch {
        return "Date(null)";
      }
    }
    $ArrayBuffer(t) {
      return `ArrayBuffer[${new Uint8Array(t).join(",")}]`;
    }
    $Set(t) {
      return `Set${this.$Array(Array.from(t).sort((r2, e) => this.compare(r2, e)))}`;
    }
    $Map(t) {
      return this.serializeObjectEntries("Map", t.entries());
    }
  }
  for (const s of ["Error", "RegExp", "URL"]) o.prototype["$" + s] = function(t) {
    return `${s}(${t})`;
  };
  for (const s of ["Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array", "Float32Array", "Float64Array"]) o.prototype["$" + s] = function(t) {
    return `${s}[${t.join(",")}]`;
  };
  for (const s of ["BigInt64Array", "BigUint64Array"]) o.prototype["$" + s] = function(t) {
    return `${s}[${t.join("n,")}${t.length > 0 ? "n" : ""}]`;
  };
  return o;
})();

// node_modules/.pnpm/ohash@2.0.11/node_modules/ohash/dist/crypto/js/index.mjs
var z = [1779033703, -1150833019, 1013904242, -1521486534, 1359893119, -1694144372, 528734635, 1541459225];
var R = [1116352408, 1899447441, -1245643825, -373957723, 961987163, 1508970993, -1841331548, -1424204075, -670586216, 310598401, 607225278, 1426881987, 1925078388, -2132889090, -1680079193, -1046744716, -459576895, -272742522, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, -1740746414, -1473132947, -1341970488, -1084653625, -958395405, -710438585, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, -2117940946, -1838011259, -1564481375, -1474664885, -1035236496, -949202525, -778901479, -694614492, -200395387, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, -2067236844, -1933114872, -1866530822, -1538233109, -1090935817, -965641998];
var S = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
var r = [];
var k = class {
  _data = new l();
  _hash = new l([...z]);
  _nDataBytes = 0;
  _minBufferSize = 0;
  finalize(e) {
    e && this._append(e);
    const s = this._nDataBytes * 8, t = this._data.sigBytes * 8;
    return this._data.words[t >>> 5] |= 128 << 24 - t % 32, this._data.words[(t + 64 >>> 9 << 4) + 14] = Math.floor(s / 4294967296), this._data.words[(t + 64 >>> 9 << 4) + 15] = s, this._data.sigBytes = this._data.words.length * 4, this._process(), this._hash;
  }
  _doProcessBlock(e, s) {
    const t = this._hash.words;
    let i = t[0], o = t[1], a = t[2], c2 = t[3], h = t[4], g = t[5], f = t[6], y = t[7];
    for (let n = 0; n < 64; n++) {
      if (n < 16) r[n] = e[s + n] | 0;
      else {
        const d = r[n - 15], j = (d << 25 | d >>> 7) ^ (d << 14 | d >>> 18) ^ d >>> 3, B = r[n - 2], x = (B << 15 | B >>> 17) ^ (B << 13 | B >>> 19) ^ B >>> 10;
        r[n] = j + r[n - 7] + x + r[n - 16];
      }
      const m = h & g ^ ~h & f, p = i & o ^ i & a ^ o & a, u = (i << 30 | i >>> 2) ^ (i << 19 | i >>> 13) ^ (i << 10 | i >>> 22), b = (h << 26 | h >>> 6) ^ (h << 21 | h >>> 11) ^ (h << 7 | h >>> 25), w = y + b + m + R[n] + r[n], M = u + p;
      y = f, f = g, g = h, h = c2 + w | 0, c2 = a, a = o, o = i, i = w + M | 0;
    }
    t[0] = t[0] + i | 0, t[1] = t[1] + o | 0, t[2] = t[2] + a | 0, t[3] = t[3] + c2 | 0, t[4] = t[4] + h | 0, t[5] = t[5] + g | 0, t[6] = t[6] + f | 0, t[7] = t[7] + y | 0;
  }
  _append(e) {
    typeof e == "string" && (e = l.fromUtf8(e)), this._data.concat(e), this._nDataBytes += e.sigBytes;
  }
  _process(e) {
    let s, t = this._data.sigBytes / 64;
    e ? t = Math.ceil(t) : t = Math.max((t | 0) - this._minBufferSize, 0);
    const i = t * 16, o = Math.min(i * 4, this._data.sigBytes);
    if (i) {
      for (let a = 0; a < i; a += 16) this._doProcessBlock(this._data.words, a);
      s = this._data.words.splice(0, i), this._data.sigBytes -= o;
    }
    return new l(s, o);
  }
};
var l = class _l {
  words;
  sigBytes;
  constructor(e, s) {
    e = this.words = e || [], this.sigBytes = s === void 0 ? e.length * 4 : s;
  }
  static fromUtf8(e) {
    const s = unescape(encodeURIComponent(e)), t = s.length, i = [];
    for (let o = 0; o < t; o++) i[o >>> 2] |= (s.charCodeAt(o) & 255) << 24 - o % 4 * 8;
    return new _l(i, t);
  }
  toBase64() {
    const e = [];
    for (let s = 0; s < this.sigBytes; s += 3) {
      const t = this.words[s >>> 2] >>> 24 - s % 4 * 8 & 255, i = this.words[s + 1 >>> 2] >>> 24 - (s + 1) % 4 * 8 & 255, o = this.words[s + 2 >>> 2] >>> 24 - (s + 2) % 4 * 8 & 255, a = t << 16 | i << 8 | o;
      for (let c2 = 0; c2 < 4 && s * 8 + c2 * 6 < this.sigBytes * 8; c2++) e.push(S.charAt(a >>> 6 * (3 - c2) & 63));
    }
    return e.join("");
  }
  concat(e) {
    if (this.words[this.sigBytes >>> 2] &= 4294967295 << 32 - this.sigBytes % 4 * 8, this.words.length = Math.ceil(this.sigBytes / 4), this.sigBytes % 4) for (let s = 0; s < e.sigBytes; s++) {
      const t = e.words[s >>> 2] >>> 24 - s % 4 * 8 & 255;
      this.words[this.sigBytes + s >>> 2] |= t << 24 - (this.sigBytes + s) % 4 * 8;
    }
    else for (let s = 0; s < e.sigBytes; s += 4) this.words[this.sigBytes + s >>> 2] = e.words[s >>> 2];
    this.sigBytes += e.sigBytes;
  }
};
function digest(_) {
  return new k().finalize(_).toBase64();
}

// node_modules/.pnpm/ohash@2.0.11/node_modules/ohash/dist/index.mjs
function hash(input) {
  return digest(serialize(input));
}

// node_modules/.pnpm/shiki-magic-move@1.2.1_reac_54cf9c9fd83ec7338353d935735a9d51/node_modules/shiki-magic-move/dist/core.mjs
function createMagicMoveMachine(codeToKeyedTokens2, options = {}) {
  const EMPTY = toKeyedTokens("", []);
  let previous = EMPTY;
  let current = EMPTY;
  function commit(code, override) {
    previous = current;
    const mergedOptions = override ? {
      ...options,
      ...override
    } : options;
    const newTokens = codeToKeyedTokens2(code, mergedOptions.lineNumbers);
    ({
      from: previous,
      to: current
    } = syncTokenKeys(previous, newTokens, mergedOptions));
    return {
      current,
      previous
    };
  }
  return {
    get current() {
      return current;
    },
    get previous() {
      return previous;
    },
    commit,
    reset() {
      previous = EMPTY;
      current = EMPTY;
    }
  };
}
function codeToKeyedTokens(highlighter, code, options, lineNumbers = false) {
  const result = highlighter.codeToTokens(code, options);
  return {
    ...toKeyedTokens(
      code,
      result.tokens,
      // We put the lang and theme to participate in the hash calculation because they can affect the tokenization
      JSON.stringify([options.lang, "themes" in options ? options.themes : options.theme]),
      lineNumbers
    ),
    bg: result.bg,
    fg: result.fg,
    rootStyle: result.rootStyle,
    themeName: result.themeName,
    lang: options.lang
  };
}
function toKeyedTokens(code, tokens, salt = "", lineNumbers = false) {
  const hash$1 = hash(code + salt);
  let lastOffset = 0;
  let firstOffset = 0;
  const lineNumberDigits = Math.ceil(Math.log10(tokens.length));
  const keyed = splitWhitespaceTokens(tokens).flatMap((line, lineIdx) => {
    firstOffset = line[0]?.offset || lastOffset;
    const lastEl = line[line.length - 1];
    if (!lastEl) lastOffset += 1;
    else lastOffset = lastEl.offset + lastEl.content.length;
    const tokens2 = [...line, {
      content: "\n",
      offset: lastOffset
    }];
    if (lineNumbers) {
      tokens2.unshift({
        key: `${hash$1}-ln-${lineIdx + 1}`,
        content: `${String(lineIdx + 1).padStart(lineNumberDigits, " ")}  `,
        offset: firstOffset,
        htmlClass: "shiki-magic-move-line-number"
      });
    }
    return tokens2;
  }).map((token, idx) => {
    const t = token;
    t.key ||= `${hash$1}-${idx}`;
    return t;
  });
  return {
    code,
    hash: hash$1,
    tokens: keyed,
    lineNumbers
  };
}
function splitWhitespaceTokens(tokens) {
  return tokens.map((line) => {
    return line.flatMap((token) => {
      if (token.content.match(/^\s+$/)) return token;
      const match = token.content.match(/^(\s*)(.*?)(\s*)$/);
      if (!match) return token;
      const [, leading, content, trailing] = match;
      if (!leading && !trailing) return token;
      const expanded = [{
        ...token,
        offset: token.offset + leading.length,
        content
      }];
      if (leading) {
        expanded.unshift({
          content: leading,
          offset: token.offset
        });
      }
      if (trailing) {
        expanded.push({
          content: trailing,
          offset: token.offset + leading.length + content.length
        });
      }
      return expanded;
    });
  });
}
function splitToken(token, offsets) {
  let lastOffset = 0;
  const key = token.key;
  let index = 0;
  const tokens = [];
  function getKey() {
    if (index === 0) {
      index++;
      return key;
    }
    return `${key}-${index++}`;
  }
  for (const offset of offsets) {
    if (offset > lastOffset) {
      tokens.push({
        ...token,
        content: token.content.slice(lastOffset, offset),
        offset: token.offset + lastOffset,
        key: getKey()
      });
    }
    lastOffset = offset;
  }
  if (lastOffset < token.content.length) {
    tokens.push({
      ...token,
      content: token.content.slice(lastOffset),
      offset: token.offset + lastOffset,
      key: getKey()
    });
  }
  return tokens;
}
function splitTokens(tokens, breakpoints) {
  const sorted = Array.from(breakpoints instanceof Set ? breakpoints : new Set(breakpoints)).sort((a, b) => a - b);
  if (!sorted.length) return tokens;
  return tokens.flatMap((token) => {
    const breakpointsInToken = sorted.filter((i) => token.offset < i && i < token.offset + token.content.length).map((i) => i - token.offset).sort((a, b) => a - b);
    if (!breakpointsInToken.length) return token;
    return splitToken(token, breakpointsInToken);
  });
}
function syncTokenKeys(from, to, options = {}) {
  const {
    splitTokens: shouldSplitTokens = false,
    enhanceMatching = true
  } = options;
  const matches = findTextMatches(from.code, to.code, options);
  const tokensFrom = shouldSplitTokens ? splitTokens(from.tokens, matches.flatMap((m) => m.from)) : from.tokens;
  const tokensTo = shouldSplitTokens ? splitTokens(to.tokens, matches.flatMap((m) => m.to)) : to.tokens;
  const matchedKeys = /* @__PURE__ */ new Set();
  matches.forEach((match) => {
    const tokensF = tokensFrom.filter((t) => t.offset >= match.from[0] && t.offset + t.content.length <= match.from[1]);
    const tokensT = tokensTo.filter((t) => t.offset >= match.to[0] && t.offset + t.content.length <= match.to[1]);
    let idxF = 0;
    let idxT = 0;
    while (idxF < tokensF.length && idxT < tokensT.length) {
      if (!tokensF[idxF] || !tokensT[idxT]) break;
      if (tokensF[idxF].content === tokensT[idxT].content) {
        tokensT[idxT].key = tokensF[idxF].key;
        matchedKeys.add(tokensF[idxF].key);
        idxF++;
        idxT++;
      } else if (tokensF[idxF + 1]?.content === tokensT[idxT].content) {
        idxF++;
      } else if (tokensF[idxF].content === tokensT[idxT + 1]?.content) {
        idxT++;
      } else {
        idxF++;
        idxT++;
      }
    }
  });
  if (enhanceMatching) {
    for (const token of tokensFrom) {
      if (matchedKeys.has(token.key)) continue;
      if (token.content.length < 3 || !token.content.match(/^[\w-]+$/)) continue;
      const matched = tokensTo.find((t) => t.content === token.content && !matchedKeys.has(t.key));
      if (matched) {
        matched.key = token.key;
        matchedKeys.add(token.key);
      }
    }
  }
  return {
    from: tokensFrom.length === from.tokens.length ? from : {
      ...from,
      tokens: tokensFrom
    },
    to: tokensTo.length === to.tokens.length ? to : {
      ...to,
      tokens: tokensTo
    }
  };
}
function findTextMatches(a, b, options = {}) {
  let delta = diffMain(a, b);
  delta = options.diffCleanup?.(delta) || delta;
  let aContent = "";
  let bContent = "";
  const matched = [];
  for (const [op, text] of delta) {
    if (op === 0) {
      matched.push({
        from: [aContent.length, aContent.length + text.length],
        to: [bContent.length, bContent.length + text.length],
        content: text
      });
      aContent += text;
      bContent += text;
    } else if (op === -1) {
      aContent += text;
    } else if (op === 1) {
      bContent += text;
    }
  }
  if (aContent !== a || bContent !== b) throw new Error("Content mismatch");
  return matched;
}

export {
  createMagicMoveMachine,
  codeToKeyedTokens,
  toKeyedTokens,
  syncTokenKeys,
  findTextMatches
};
//# sourceMappingURL=chunk-53U3M4XD.js.map
