import { MathfieldElement, MathfieldOptions } from 'mathlive';
import { PropsWithChildren } from 'react';

type ExcludeKey<K, KeyToExclude> = K extends KeyToExclude ? never : K;
type ExcludeField<A, KeyToExclude extends keyof A> = {
  [K in ExcludeKey<keyof A, KeyToExclude>]: A[K];
};
// export interface IStringIndex extends Record<string, any> {}

export declare type MathFieldChangeEvent = CustomEvent<{
  value: string;
  mathfield: MathfieldElement;
}>;
export declare type MathChangeEvent = React.SyntheticEvent<
  HTMLInputElement,
  MathFieldChangeEvent
>;

export declare type MathViewProps = PropsWithChildren<
  Partial<
    ExcludeField<React.HTMLAttributes<MathfieldElement>, 'onChange'> & {
      containerClassName?: string;
      /** LaTeX to render, optionally can be passed as child */
      value: string;
      onFocus: React.HTMLAttributes<MathfieldElement>['onFocus'];
      onBlur: React.HTMLAttributes<MathfieldElement>['onBlur'];
      onChange: React.EventHandler<
        React.SyntheticEvent<MathfieldElement, MathFieldChangeEvent>
      >;
      options: Partial<MathfieldOptions>;
    }
  >
>;

export declare type MathViewRef = MathfieldElement;
