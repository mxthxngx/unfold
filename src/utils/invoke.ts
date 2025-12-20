import { Layout } from "@/types/layout";
import { invoke as tauriInvoke } from '@tauri-apps/api/core';

export interface UploadImageRequest {
    noteId: string;
    fileName: string;
    base64Data: string;
    mimeType: string;
    size: number;
    [key: string]: unknown;
}

export interface UploadImageResponse {
    id: string;
    path: string;
    size: number;
}

type InvokeMap = {
    get_layout_settings: {
        args: {}; 
        returnType: Layout;
    };
    save_layout_settings: {
        args: { layout: Layout }; 
        returnType: void;
    };
    upload_image: {
        args: UploadImageRequest;
        returnType: UploadImageResponse;
    };
    get_image: {
        args: { attachmentId: string };
        returnType: string;
    };
    delete_image: {
        args: { attachmentId: string };
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

// Convenience functions for image operations
export const uploadImage = (request: UploadImageRequest) => 
    tauriInvoke<UploadImageResponse>('upload_image', {
        request: {
            note_id: request.noteId,
            file_name: request.fileName,
            base64_data: request.base64Data,
            mime_type: request.mimeType,
            size: request.size,
        }
    });

export const getImage = (attachmentId: string) => 
    tauriInvoke<string>('get_image', { attachmentId });

export const deleteImage = (attachmentId: string) => 
    tauriInvoke('delete_image', { attachmentId });