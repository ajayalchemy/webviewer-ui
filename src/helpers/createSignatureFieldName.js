export default function createSignatureFieldName(fieldName, count) {
  const originalString = fieldName;
  const index = Number(count);
  return replaceCharacterBetween(originalString, '[', ']', '', index.toString());
}

export function replaceBracketedText(inputString) {
  // Use regular expression to replace "[x]" with an empty string
  return inputString.replace(/\[[^\]]+\]/g, '');
}

export function getCountOfFields(arr, fieldName) {
  const elementCounts = countOccurrences(arr);
  for (const element in elementCounts) {
    if (fieldName === element) {
      return elementCounts[element];
    }
  }
}

export function countOccurrences(arr) {
  const counts = {};

  for (const element of arr) {
    if (!counts[element]) {
      counts[element] = 1;
    } else {
      counts[element]++;
    }
  }

  return counts;
}




function replaceCharacterBetween(sourceString, startChar, endChar, replacementChar, replaceWith) {
  const startIndex = sourceString.indexOf(startChar);
  const endIndex = sourceString.lastIndexOf(endChar);

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    return sourceString;
  }

  const beforeStart = sourceString.substring(0, startIndex + 1);
  const betweenCharacters = sourceString.substring(startIndex + 1, endIndex);
  const afterEnd = sourceString.substring(endIndex);

  const replacedBetween = betweenCharacters.replace(
    new RegExp(replacementChar, 'g'),
    replaceWith
  );

  return beforeStart + replaceWith + afterEnd;
}

function findCharacterBetween(sourceString, startChar, endChar) {
  const startIndex = sourceString.indexOf(startChar);
  const endIndex = sourceString.lastIndexOf(endChar);

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    return null; // Start or end character not found, or start comes after end
  }

  const charactersBetween = sourceString.substring(startIndex + 1, endIndex);

  return charactersBetween;
}




