import isEqual from 'lodash.isequal';
import { MathfieldOptions } from 'mathlive';
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef
} from 'react';
import { renderToString } from 'react-dom/server';
import { MathViewProps, MathViewRef } from './types';
import _ from 'lodash';

/**
 * These are options that are passed as a product of MathFieldOptions
 */
export const OPTIONS: Array<keyof MathfieldOptions> = [
  'defaultMode',
  'macros',
  'registers',
  'colorMap',
  'backgroundColorMap',
  'letterShapeStyle',
  'minFontScale',
  'readOnly',
  'smartMode',
  'smartFence',
  'smartSuperscript',
  'scriptDepth',
  'removeExtraneousParentheses',
  'mathModeSpace',
  'placeholderSymbol',
  'popoverPolicy',
  'mathVirtualKeyboardPolicy',
  'inlineShortcuts',
  'inlineShortcutTimeout',
  'keybindings',
  'onInlineShortcut',
  'onScrollIntoView',
  'onExport'
];

/**
 * mount/unmount are unhandled
 */
const FUNCTION_MAPPING = {
  /** retargeting onChange to fire input events to match react expected behavior */
  onChange: 'input',
  onInput: 'input',
  /** rename onFocus to prevent name collision */
  onMathFieldFocus: 'focus',
  /** rename onBlur to prevent name collision */
  onMathFieldBlur: 'blur',
  onCommit: 'change',
  // onContentDidChange,
  // onContentWillChange,
  onError: 'math-error',
  onKeystroke: 'keystroke',
  onModeChange: 'mode-change',
  onMoveOutOf: 'focus-out',
  onReadAloudStatus: 'read-aloud-status',
  // onSelectionDidChange: 'selection-did-change',
  onSelectionWillChange: 'selection-will-change',
  // onTabOutOf,
  onUndoStateDidChange: 'undo-state-did-change',
  onUndoStateWillChange: 'undo-state-will-change',
  onVirtualKeyboardToggle: 'virtual-keyboard-toggle'
};

const FUNCTION_PROPS = Object.keys(FUNCTION_MAPPING);

const MAPPING = {
  className: 'class',
  htmlFor: 'for'
};

/**
 * Returns whether the given key is a key of the given object.
 * `PropertyKey` is short for "string | number | symbol"
 * since an object key can be any of those types, our key can too
 * in TS 3.0+, putting just "string" raises an error
 * @param obj The object to search
 * @param key The key to search for
 * @returns boolean for whether the key is in the object
 */
function hasKey<O extends object>(obj: O, key: PropertyKey): key is keyof O {
  return key in obj;
}

export function useValue(
  props: MathViewProps,
  ref: React.RefObject<MathViewRef>
) {
  const value = useMemo(
    () =>
      props.children
        ? renderToString(props.children as React.ReactElement)!
        : props.value || '',
    [props.children, props.value]
  );
  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.setValue !== undefined) {
    ref.current?.setValue(value);
    } else {
      console.log('ref.current.setValue is undefined');
    }
  }, [ref, value]);

  return value;
}
/**
 * Filters the config from the props based on the valid values of MathfieldOptions. Any additional props are passed as is.
 * @param props The props to filter
 * @returns [config -> to be set on the ref, passProps -> to be passed through to the mathfield element]
 */
export function filterConfig(props: MathViewProps) {
  const config: Partial<MathfieldOptions> = {};
  const passProps: MathViewProps = {};
  for (const _key in props) {
    let key = _key;
    if (hasKey(MAPPING, key)) {
      key = MAPPING[key];
    }
    let value = props[_key];
    if (hasKey(FUNCTION_MAPPING, key)) {
      //  handled by attaching event listeners
    } else if (hasKey(OPTIONS, key)) {
      // If in OPTIONS, then put in config
      if (
        React.isValidElement(value) ||
        (value instanceof Array && value.every(React.isValidElement))
      ) {
        value = renderToString(value as React.ReactElement);
      }
      config[key] = value;
    } else if (key !== 'value') {
      // If not in OPTIONS, then put in passProps
      passProps[key] = value;
    }
  }
  return [config, passProps] as [typeof config, typeof passProps];
}

/**
 * Mathfield resets caret position when value is set imperatively (not while editing).
 * This is why we need to set caret position for controlled math view after value has been changed.
 */
export function useControlledConfig(
  value: string,
  {
   
    ...props
  }: ReturnType<typeof filterConfig>[0]
) {
 // const position = useRef<{ x: number; y: number } | null>(null);
  const _value = useRef<string>(value || '');
  //  save caret position if necessary
  // const _onContentWillChange = useCallback(
  //   (sender: Mathfield) => {
  //     const p =
  //       _value.current !== value &&
  //       sender.getCaretPoint &&
  //       sender.getCaretPoint();
  //     p && (position.current = p);
  //     onContentWillChange && onContentWillChange(sender);
  //   },
  //   [onContentWillChange, value]
  // );
  // //  set caret position if necessary
  // const _onContentDidChange = useCallback(
  //   (sender: Mathfield) => {
  //     position.current &&
  //       sender.setCaretPoint(position.current.x, position.current.y);
  //     onContentDidChange && onContentDidChange(sender);
  //   },
  //   [onContentDidChange]
  // );
  //  update _value
  useEffect(() => {
    _value.current = value || '';
  }, [value]);
  return {
    ...props,
    // onContentWillChange: _onContentWillChange,
    // onContentDidChange: _onContentDidChange
  };
}

/**
 * Performance Optimization
 * ------------------------
 * This hook memoizes config in order to prevent unnecessary rendering/changes
 * The hook deemed the new config dep !== previous config dep, hence invoking `setOptions`.
 * This solution will update options only if they have changed is comparison to the previous values (not object containing them),
 *  avoiding uncessary rendering.
 *
 * @param ref
 * @param config
 */
export function useUpdateOptions(
  ref: React.RefObject<MathViewRef>,
  config: Partial<MathfieldOptions>
) {
  const configRef = useRef(config);
  useLayoutEffect(() => {
    if (!ref.current) return;
    if (!isEqual(configRef.current, config)) {
      const currentOptions = configRef.current;
      const nextOptions = config;
      const keys = _.union(
        Object.keys(currentOptions),
        Object.keys(nextOptions)
      );
      const diff = keys.filter((key) => {
        return !isEqual(currentOptions[key], nextOptions[key]);
      });
      for (const key of diff) {
        // ref.current?[key] = nextOptions[key];
        ref.current[key] = nextOptions[key];
        // ref.current?.setOptions({ [key]: nextOptions[key] });
      }
      // ref.current?.setOptions(config);
      configRef.current = config;
    }
  }, [ref, config, configRef]);
  // set options after rendering for first rendering pass, by then the mathfield has mounted and is able to receive it, before it mounted nothing happens
  useEffect(() => {
    if (!ref.current) return;
    for (const key in config) {
      ref.current[key] = config[key];
    }
  }, []);
}


export function useEventRegistration(
  ref: React.RefObject<HTMLElement>,
  props: MathViewProps
) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const fns: { key: string; fn: (customEvent: any) => any }[] = Object.keys(
      props
    )
      .filter(
        (key) =>
          typeof props[key] === 'function' &&
          FUNCTION_PROPS.indexOf(MAPPING[key] || key) > -1
      )
      .map((key) => {
        return {
          key: FUNCTION_MAPPING[MAPPING[key] || key],
          fn: (...args: any[]) => {
            props[key](...args);
          }
        };
      });

    fns.forEach(({ key, fn }) => {
      node.addEventListener(key, fn);
    });

    return () => {
      fns.forEach(({ key, fn }) => node.removeEventListener(key, fn));
    };
  }, [ref, props]);
}
