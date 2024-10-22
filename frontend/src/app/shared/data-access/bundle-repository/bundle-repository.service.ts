import { Injectable } from '@angular/core';
import {HttpClient, HttpContext} from "@angular/common/http";
import {BundleFormDto} from "../../models/BundlePostDto";
import {BundleGetResponse, BundleUploadResponse, PresignedUrlResponse} from "../../models/Bundle";

import {environment} from "../../../../environments/environment";
import { Observable, of } from 'rxjs';
import { WITHOUT_AUTH } from '../../interceptors/add-token.interceptor';

const API_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root',
})
export class BundleRepository {
  constructor(private readonly httpClient: HttpClient) { }


  postBundle(bundle: BundleFormDto) {
    return this.httpClient.post<BundleUploadResponse>(`${API_URL}/bandoru`, bundle);
  }

  getBundle(id: string) {
    return this.httpClient.get<BundleGetResponse>(`${API_URL}/bandoru/${id}`);
  }

  getBundles(userId: string): Observable<BundleGetResponse[]> {
    return of([{
      id: "hola",
      description: "aaaaa",
      files: [],
      created_at: new Date(),
      last_modified: new Date(),
    }]);
    // const search = new URLSearchParams({ user: userId });
    // return this.httpClient.get<BundleGetResponse[]>(`${API_URL}/bandoru?` + search.toString());
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
}
