import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponseHeaders,
  HttpStatusCode,
  Method,
  RawAxiosResponseHeaders,
  ResponseType
} from 'axios'

interface StringMap {
  [k: string]: string
}

type AwaitedResponse<T> = Promise<IHttpResponse<T>>

export interface IHttpRequestConstructor {
  timeout: number
  baseUrl: string
  headers: StringMap
}

export interface IHttpRequestExtraParams {
  headers: StringMap
  responseType: ResponseType
  data: any
  maxRequestLength: number
  maxResponseLength: number
}

export interface IHttpResponse<T> {
  hasError: boolean
  statusCode: -1 | HttpStatusCode
  headers: AxiosResponseHeaders | RawAxiosResponseHeaders
  raw: {
    request: AxiosRequestConfig
    response?: AxiosResponse
    error?: AxiosError
  }
  content?: T
}

export default class HttpRequest {
  protected timeout: number
  protected headers: StringMap
  protected baseUrl?: string

  public constructor (params?: Partial<IHttpRequestConstructor>) {
    const { timeout = 10000, headers = {}, baseUrl } = params ?? {}

    this.baseUrl = baseUrl
    this.timeout = timeout
    this.headers = Object.assign({ 'Content-Type': 'application/json' }, headers)
  }

  private async perform<T>(request: AxiosRequestConfig): AwaitedResponse<T> {
    const source = axios.CancelToken.source()
    setTimeout((): void => {
      source.cancel()
    }, this.timeout)

    try {
      request.cancelToken = source.token
      const response = await axios(request)

      return {
        hasError: false,
        statusCode: response.status,
        headers: response.headers,
        content: response.data,
        raw: { request, response }
      }
    } catch (e: any) {
      return {
        hasError: true,
        statusCode: e?.response?.status ?? -1,
        headers: e?.response?.headers ?? {},
        content: e?.response?.data,
        raw: { request, error: e }
      }
    }
  }

  protected async request<T>(method: Method, url: string, params?: Partial<IHttpRequestExtraParams>): AwaitedResponse<T> {
    const { headers = {}, responseType = 'json', maxRequestLength = Infinity, maxResponseLength = Infinity, data } = params ?? {}

    // see: <https://axios-http.com/docs/req_config>
    const payload: AxiosRequestConfig = {
      url,
      method,
      responseType,
      baseURL: this.baseUrl,
      headers: Object.assign({}, this.headers, headers),
      maxBodyLength: maxRequestLength,
      maxContentLength: maxResponseLength
    }

    if (data !== undefined && data !== null) {
      switch (method.toLowerCase()) {
        case 'get':
          payload.params = data
          break

        case 'put':
        case 'post':
          payload.data = data
          break

        default:
          throw new Error(`Payload data is not supported for method ${method}`)
      }
    }

    return await this.perform<T>(payload)
  }
}
