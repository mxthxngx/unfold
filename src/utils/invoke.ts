import { Layout } from "@/types/layout";
import { invoke as tauriInvoke } from '@tauri-apps/api/core';

type InvokeMap = {
    get_layout_settings: {
        args: {}; 
        returnType: Layout;
    };
    save_layout_settings: {
        args: { layout: Layout }; 
        returnType: void;
    };
};

type InvocationName = keyof InvokeMap;

export default function invoke<TInvocationName extends InvocationName>(
    command: TInvocationName,
    args: InvokeMap[TInvocationName]['args'],
) {
    return tauriInvoke<InvokeMap[TInvocationName]['returnType']>(command, args);
}