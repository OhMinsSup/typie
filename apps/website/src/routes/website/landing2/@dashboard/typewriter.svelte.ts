import { assemble, disassemble } from 'es-hangul';
import type { MotionValue } from 'motion';

type NodeInfo = {
  textNode: Text;
  range: [number, number];
  originalText: string;
  characterParts: string[][];
};

type TypewriterParams = {
  value: MotionValue<number>;
  showCursor: boolean;
};

const HANGUL_REGEX = /[가-힣]/;
const PART_REGEX = /[ㄱ-ㅎㅏ-ㅣ]/;

const getText = (node: Node): Text[] => (node.nodeType === Node.TEXT_NODE ? [node as Text] : [...(node.childNodes || [])].flatMap(getText));

export const typewriter = (node: Element, params: TypewriterParams) => {
  let { value, showCursor } = params;

  const textNodes = getText(node);
  if (textNodes.length === 0) return;

  let totalParts = 0;
  const nodeRanges: NodeInfo[] = textNodes.map((textNode) => {
    const originalText = textNode.textContent ?? '';
    const characterParts: string[][] = [];
    let partCount = 0;

    for (const char of originalText) {
      const parts = HANGUL_REGEX.test(char) ? [...disassemble(char)] : [char];
      characterParts.push(parts);
      partCount += parts.length;
    }

    const startPos = totalParts;
    totalParts += partCount;

    return {
      textNode,
      originalText,
      characterParts,
      range: [startPos, totalParts],
    };
  });

  // 초기에 모든 텍스트를 숨김
  nodeRanges.forEach(({ textNode }) => {
    textNode.textContent = '';
  });

  // 커서 요소 생성
  const cursorElement = document.createElement('span');
  cursorElement.innerHTML = '&nbsp;'; // non-breaking space
  cursorElement.style.cssText = `
    display: inline-block;
    background-color: #000;
    animation: blink 1s step-end infinite;
    margin-left: 2px;
    vertical-align: baseline;
    width: 8px;
    height: 1.2em;
    line-height: 1.2em;
  `;

  let unsubscribe: (() => void) | null = null;
  let currentActiveTextNode: Text | null = null;

  const updateText = (progress: number) => {
    const position = Math.floor(totalParts * progress);
    let currentNodeIndex = 0;
    let activeTextNode: Text | null = null;

    // 완료된 노드들은 전체 텍스트 표시
    while (currentNodeIndex < nodeRanges.length && position >= nodeRanges[currentNodeIndex].range[1]) {
      const { textNode, originalText } = nodeRanges[currentNodeIndex];
      textNode.textContent = originalText;
      currentNodeIndex++;
    }

    // 현재 진행 중인 노드
    if (currentNodeIndex < nodeRanges.length) {
      const currentNode = nodeRanges[currentNodeIndex];
      const visibleParts = position - currentNode.range[0];

      if (visibleParts <= 0) {
        currentNode.textNode.textContent = '';
        activeTextNode = currentNode.textNode;
      } else {
        let result = '';
        let processedParts = 0;

        for (const parts of currentNode.characterParts) {
          if (processedParts >= visibleParts) break;

          const partsToShow = Math.min(parts.length, visibleParts - processedParts);
          if (partsToShow <= 0) break;

          result +=
            parts.length > 1 && PART_REGEX.test(parts[0])
              ? assemble(partsToShow < parts.length ? parts.slice(0, partsToShow) : parts)
              : parts[0];

          processedParts += parts.length;
        }

        currentNode.textNode.textContent = result;
        activeTextNode = currentNode.textNode;
      }

      // 나머지 노드들은 비움
      for (let i = currentNodeIndex + 1; i < nodeRanges.length; i++) {
        nodeRanges[i].textNode.textContent = '';
      }
    } else if (nodeRanges.length > 0) {
      // 모든 텍스트가 완료된 경우 마지막 노드를 활성 노드로 설정
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      activeTextNode = nodeRanges.at(-1)!.textNode;
    }

    currentActiveTextNode = activeTextNode;
    updateCursor();
  };

  const updateCursor = () => {
    // 기존 커서 제거
    cursorElement.remove();

    // showCursor가 true이고 활성 텍스트 노드가 있을 때만 커서 추가
    if (showCursor && currentActiveTextNode && currentActiveTextNode.parentNode) {
      currentActiveTextNode.parentNode.insertBefore(cursorElement, currentActiveTextNode.nextSibling);
    }
  };

  // $effect를 사용하여 value와 showCursor 변화 감지
  $effect(() => {
    const currentValue = value.get();
    updateText(currentValue);
  });

  // value의 변화를 구독
  unsubscribe = value.on('change', (currentValue) => {
    updateText(currentValue);
  });

  return {
    update(newParams: TypewriterParams) {
      value = newParams.value;
      showCursor = newParams.showCursor;

      // showCursor 변경 시 즉시 커서 상태 업데이트
      updateCursor();
    },
    destroy() {
      if (unsubscribe) {
        unsubscribe();
      }
      // 커서 제거
      cursorElement.remove();
      // 정리 시 원본 텍스트 복원
      nodeRanges.forEach(({ textNode, originalText }) => {
        textNode.textContent = originalText;
      });
    },
  };
};
