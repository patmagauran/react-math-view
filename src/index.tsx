import { MathfieldElement  } from 'mathlive';
import 'mathlive/fonts.css';
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
    const mfe = useMemo(() => new MathfieldElement(), []);

    useEffect(() => {
      const container = containerRef.current!!;
      container.innerHTML = "";
      container.appendChild(mfe);
    }, [mfe]);
    const _ref = useRef<MathfieldElement>(mfe);
    useImperativeHandle(ref, () => {
      console.log(ref);
      return mfe;
    }, [mfe]);
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
