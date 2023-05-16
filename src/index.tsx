import { MathfieldElement } from 'mathlive';
import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { MathViewProps } from './types';
import {
  filterConfig,
  useControlledConfig,
  useEventRegistration,
  useUpdateOptions,
  useValue
} from './utils';

const MathView = React.forwardRef<MathfieldElement, MathViewProps>(
  (props, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    // const mfe = useMemo(
    //   () => ,
    //   [null]
    // );
    const _ref = useRef<MathfieldElement>(new MathfieldElement(props.options));
    const mfe = _ref.current;
    useEffect(() => {
      const container = containerRef.current!!;
      container.innerHTML = '';
      container.appendChild(mfe);
    }, [mfe]);
    useImperativeHandle(
      ref,
      () => {
        return mfe;
      },
      [mfe]
    );
    // useImperativeHandle(
    //   ref,
    //   () => {
    //     return mfe;
    //   },
    //   [mfe]
    // );
    const value = useValue(props, _ref);
    const [config, passProps] = useMemo(() => filterConfig(props), [props]);
    const transformedConfig = useControlledConfig(value, config);
    useEventRegistration(_ref, props);
    useUpdateOptions(_ref, transformedConfig);
    useEffect(() => {
      for (const key in passProps) {
        if (key === 'children') continue;

        mfe.setAttribute(key, passProps[key]);
      }
    }, [passProps, mfe]);
    return (
      <div ref={containerRef} />
      // <math-field
      //   {...passProps}
      //   // onFocus={props.onFocus}
      //   // onBlur={props.onBlur}
      //   onChange={undefined}
      //   ref={_ref}
      // >
      //   {value}
      // </math-field>
    );
  }
);

export * from './types';
export default MathView;
