import { Injectable } from '@angular/core';
import {HttpClient, HttpContext} from "@angular/common/http";
import {BundleFormDto} from "../../models/BundlePostDto";
import {BundleGetResponse, BundleUploadResponse, PresignedUrlResponse} from "../../models/Bundle";

import {environment} from "../../../../environments/environment";
import {Observable, of, retry, switchMap, zip} from 'rxjs';
import { WITHOUT_AUTH } from '../../interceptors/add-token.interceptor';
import { map, catchError } from 'rxjs/operators';

const API_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root',
})
export class BundleRepository {
  constructor(private readonly httpClient: HttpClient) { }


  postBundle(bundle: BundleFormDto) {
    const bundleNoContents = {
      files: bundle.files.map((file) => ({ filename: file.filename })),
      description: bundle.description,
      private: bundle.private,
      parent_id: bundle.parent_id,
    } as BundleFormDto;
    
    return this.httpClient.post<BundleUploadResponse>(`${API_URL}/bandoru`, bundleNoContents).pipe(this.uploadFileWithRetry(bundle));
  }

  putBundle(id: string, bundle: BundleFormDto) {
    return this.httpClient.put<BundleUploadResponse>(`${API_URL}/bandoru/${id}`, {
      description: bundle.description,
      files: bundle.files.map((file) => ({ filename: file.filename }))
    }).pipe(this.uploadFileWithRetry(bundle));
  }

  uploadFileWithRetry(bundle: BundleFormDto) {
    return switchMap((bundleResponse: BundleUploadResponse) => {
      const uploads = bundleResponse.post_urls.map((url, index) => {
        const blob = new Blob([bundle?.files?.[index]?.bundleText ?? '']);
        const file = new File([blob], "placeholder_filename");
        return this.uploadFile(url, file).pipe(retry(2));
      });
      return zip(uploads).pipe(map(() => ({ ...bundleResponse})));
    });
  }

  getBundle(id: string) {
    return this.httpClient.get<BundleGetResponse>(`${API_URL}/bandoru/${id}`);
  }

  getBundles(userId: string): Observable<BundleGetResponse[]> {
    const search = new URLSearchParams({ user: userId });
    return this.httpClient.get<BundleGetResponse[]>(`${API_URL}/bandoru?` + search.toString(), { observe: 'response' }).pipe(map((response) => {
      if (response.status === 204) {
        return [];
      }
      return response.body ?? [];
    }));
  }

  getBookmarks(userId: string): Observable<BundleGetResponse[]> {
    return this.httpClient.get<BundleGetResponse[]>(`${API_URL}/users/${userId}/bookmarks`);
  }

  isBookmarked(userId: string, bundleId: string): Observable<boolean> {
    return this.getBookmarks(userId).pipe(
      map((bookmarks) => {
        return bookmarks.some((bookmark) => bookmark.id === bundleId)
      }),
      catchError(() => of(false))
    );
  }

  postBookmark(userId: string, bundleId: string) {
    return this.httpClient.post(
      `${API_URL}/users/${userId}/bookmarks`,
      `"${bundleId}"`,
      {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'text'
      },
    );
  }

  deleteBookmark(userId: string, bundleId: string) {
    return this.httpClient.delete(`${API_URL}/users/${userId}/bookmarks/${bundleId}`);
  }

  uploadFile(url: PresignedUrlResponse, file: File) {
    const formData = new FormData();

    for (const key in url.fields) {
      formData.append(key, url.fields[key]);
    }

    formData.append('file', file);

    return this.httpClient.post(url.url, formData, {
      context: new HttpContext().set(WITHOUT_AUTH, true)
    });
  }

  downloadFile(url: string): Observable<ArrayBuffer> {
    return this.httpClient.get(url, {
      responseType: "arraybuffer",
      context: new HttpContext().set(WITHOUT_AUTH, true)
    });
  }

  putWebhooks(bandoruId: string, webhooks: string[]) {
    return this.httpClient.put(`${API_URL}/bandoru/${bandoruId}/webhooks`, webhooks);
  }

  getWebhooks(bandoruId: string) {
    return this.httpClient.get<string[]>(`${API_URL}/bandoru/${bandoruId}/webhooks`);
  }
}
