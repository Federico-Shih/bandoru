import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {BundleFormDto} from "../../models/BundlePostDto";
import {BundleGetResponse, BundleUploadResponse, PresignedUrlResponse} from "../../models/Bundle";

import {environment} from "../../../../environments/environment";

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

  getBundles(id: string) {
    return this.httpClient.get<BundleGetResponse[]>(`${API_URL}/bandoru/${id}`);
  }

  uploadFile(url: PresignedUrlResponse, file: File) {
    const formData = new FormData();

    formData.append('acl', 'public-read');

    for (const key in url.fields) {
      formData.append(key, url.fields[key]);
    }

    formData.append('file', file);

    return this.httpClient.post(url.url, formData);
  }
  downloadS3File(url: string) {
    return this.httpClient.get(url, {responseType: 'text'});
  }
}
