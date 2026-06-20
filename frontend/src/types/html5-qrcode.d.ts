declare module 'html5-qrcode' {
  export interface Html5QrcodeCameraScanConfig {
    fps?: number
    qrbox?: number | { width: number; height: number }
    aspectRatio?: number
    disableFlip?: boolean
  }

  export type Html5QrcodeCameraConfig =
    | string
    | {
        facingMode?: 'user' | 'environment' | string
        deviceId?: string | { exact: string }
      }

  export class Html5Qrcode {
    constructor(elementId: string, verbose?: boolean)

    start(
      cameraConfig: Html5QrcodeCameraConfig,
      configuration: Html5QrcodeCameraScanConfig,
      qrCodeSuccessCallback: (decodedText: string, decodedResult: unknown) => void,
      qrCodeErrorCallback?: (errorMessage: string, error: unknown) => void,
    ): Promise<void>

    stop(): Promise<void>
    clear(): void
  }
}
