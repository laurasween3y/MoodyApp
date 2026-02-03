/**
 * Planner API (manually added to mirror generated services)
 */
/* tslint:disable:no-unused-variable member-ordering */
import { Inject, Injectable, Optional } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';

import { PlannerEventCreate } from '../model/planner-event-create';
import { PlannerEventResponse } from '../model/planner-event-response';
import { PlannerEventUpdate } from '../model/planner-event-update';
import { BASE_PATH } from '../variables';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';

@Injectable({ providedIn: 'root' })
export class PlannerService extends BaseService {
  constructor(
    protected httpClient: HttpClient,
    @Optional() @Inject(BASE_PATH) basePath: string | string[],
    @Optional() configuration?: Configuration
  ) {
    super(basePath, configuration);
  }

  /** List planner events (optional ?date=YYYY-MM-DD) */
  public plannerEventsGet(date?: string, observe: 'body' = 'body', reportProgress: boolean = false, options?: { httpHeaderAccept?: 'application/json', context?: HttpContext, transferCache?: boolean }): Observable<PlannerEventResponse[]> {
    let localVarHeaders = this.defaultHeaders;
    const localVarHttpHeaderAcceptSelected: string | undefined = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept(['application/json']);
    if (localVarHttpHeaderAcceptSelected !== undefined) {
      localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
    }
    const localVarHttpContext: HttpContext = options?.context ?? new HttpContext();
    const localVarTransferCache: boolean = options?.transferCache ?? true;
    let localVarPath = `/planner/events`;
    const { basePath, withCredentials } = this.configuration;
    const params = date ? { params: { date } } : {};
    return this.httpClient.request<PlannerEventResponse[]>('get', `${basePath}${localVarPath}`, {
      context: localVarHttpContext,
      responseType: <any>'json',
      ...(withCredentials ? { withCredentials } : {}),
      headers: localVarHeaders,
      observe: 'body',
      ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
      reportProgress,
      ...params,
    }) as any;
  }

  /** Create planner event */
  public plannerEventsPost(body: PlannerEventCreate, observe: 'body' = 'body', reportProgress: boolean = false, options?: { httpHeaderAccept?: 'application/json', context?: HttpContext }): Observable<PlannerEventResponse> {
    if (body === null || body === undefined) {
      throw new Error('PlannerEventsPost body is required');
    }
    let localVarHeaders = this.defaultHeaders;
    const localVarHttpHeaderAcceptSelected: string | undefined = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept(['application/json']);
    if (localVarHttpHeaderAcceptSelected !== undefined) {
      localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
    }
    const localVarHttpContext: HttpContext = options?.context ?? new HttpContext();
    const { basePath, withCredentials } = this.configuration;
    const localVarPath = `/planner/events`;
    return this.httpClient.request<PlannerEventResponse>('post', `${basePath}${localVarPath}`, {
      context: localVarHttpContext,
      responseType: <any>'json',
      ...(withCredentials ? { withCredentials } : {}),
      headers: localVarHeaders,
      observe: 'body',
      reportProgress,
      body,
    }) as any;
  }

  /** Get a single planner event */
  public plannerEventsIdGet(eventId: number, observe: 'body' = 'body', reportProgress: boolean = false, options?: { httpHeaderAccept?: 'application/json', context?: HttpContext }): Observable<PlannerEventResponse> {
    if (eventId === null || eventId === undefined) {
      throw new Error('eventId is required');
    }
    let localVarHeaders = this.defaultHeaders;
    const localVarHttpHeaderAcceptSelected: string | undefined = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept(['application/json']);
    if (localVarHttpHeaderAcceptSelected !== undefined) {
      localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
    }
    const localVarHttpContext: HttpContext = options?.context ?? new HttpContext();
    const { basePath, withCredentials } = this.configuration;
    const localVarPath = `/planner/events/${encodeURIComponent(String(eventId))}`;
    return this.httpClient.request<PlannerEventResponse>('get', `${basePath}${localVarPath}`, {
      context: localVarHttpContext,
      responseType: <any>'json',
      ...(withCredentials ? { withCredentials } : {}),
      headers: localVarHeaders,
      observe: 'body',
      reportProgress,
    }) as any;
  }

  /** Update a planner event */
  public plannerEventsIdPut(eventId: number, body: PlannerEventUpdate, observe: 'body' = 'body', reportProgress: boolean = false, options?: { httpHeaderAccept?: 'application/json', context?: HttpContext }): Observable<PlannerEventResponse> {
    if (eventId === null || eventId === undefined) {
      throw new Error('eventId is required');
    }
    let localVarHeaders = this.defaultHeaders;
    const localVarHttpHeaderAcceptSelected: string | undefined = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept(['application/json']);
    if (localVarHttpHeaderAcceptSelected !== undefined) {
      localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
    }
    const localVarHttpContext: HttpContext = options?.context ?? new HttpContext();
    const { basePath, withCredentials } = this.configuration;
    const localVarPath = `/planner/events/${encodeURIComponent(String(eventId))}`;
    return this.httpClient.request<PlannerEventResponse>('put', `${basePath}${localVarPath}`, {
      context: localVarHttpContext,
      responseType: <any>'json',
      ...(withCredentials ? { withCredentials } : {}),
      headers: localVarHeaders,
      observe: 'body',
      reportProgress,
      body,
    }) as any;
  }

  /** Delete a planner event */
  public plannerEventsIdDelete(eventId: number, observe: any = 'body', reportProgress: boolean = false, options?: { httpHeaderAccept?: 'application/json', context?: HttpContext }): Observable<any> {
    if (eventId === null || eventId === undefined) {
      throw new Error('eventId is required');
    }
    let localVarHeaders = this.defaultHeaders;
    const localVarHttpHeaderAcceptSelected: string | undefined = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept(['application/json']);
    if (localVarHttpHeaderAcceptSelected !== undefined) {
      localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
    }
    const localVarHttpContext: HttpContext = options?.context ?? new HttpContext();
    const { basePath, withCredentials } = this.configuration;
    const localVarPath = `/planner/events/${encodeURIComponent(String(eventId))}`;
    return this.httpClient.request<any>('delete', `${basePath}${localVarPath}`, {
      context: localVarHttpContext,
      responseType: <any>'json',
      ...(withCredentials ? { withCredentials } : {}),
      headers: localVarHeaders,
      observe,
      reportProgress,
    });
  }
}
