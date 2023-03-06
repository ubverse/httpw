import axios, { AxiosRequestConfig, Method } from 'axios'

export interface IHttpResponse<T = any> {
  error: boolean
  content: T
}

export default class HttpRequest {
  protected timeout: number
  protected headers: { [k: string]: string }
  protected baseUrl?: string

  public constructor (timeout?: number) {
    this.timeout = timeout ?? 10000
    this.headers = {
      'Content-Type': 'application/json'
    }
  }

  private async perform<T>(payload: AxiosRequestConfig): Promise<IHttpResponse<T>> {
    const source = axios.CancelToken.source()
    setTimeout((): void => {
      source.cancel()
    }, this.timeout)

    let error = false
    let content: any

    try {
      payload.cancelToken = source.token
      content = await axios(payload)
    } catch (e) {
      error = true
      content = e
    }

    return { error, content }
  }

  protected async request<T = any>(url: string, data?: any, method: Method = 'get'): Promise<IHttpResponse<T>> {
    const payload: AxiosRequestConfig = {
      url,
      method,
      headers: this.headers,
      maxContentLength: Infinity
    }

    if (typeof this.baseUrl !== 'undefined') {
      payload.baseURL = this.baseUrl
    }

    if (typeof data !== 'undefined' && data !== null) {
      switch (method.toLowerCase()) {
        case 'get':
          payload.params = data
          break

        case 'put':
        case 'post':
          payload.data = data
          break
      }
    }

    return await this.perform(payload)
  }
}
