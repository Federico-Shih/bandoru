import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {BundleFormDto} from "../../models/BundlePostDto";
import {BundleUploadResponse} from "../../models/Bundle";

@Injectable({
  providedIn: 'root',
})
export class BundleRepository {
  constructor(private readonly httpClient: HttpClient) { }

  postBundle(bundle: BundleFormDto) {
    return this.httpClient.post<BundleUploadResponse>('bandoru', bundle);
  }

  getBundle(id: string) {
    return this.httpClient.get<BundleUploadResponse>(`bandoru/${id}`);
  }

  uploadFile(url: string, file: File) {
    return this.httpClient.put(url, file);
  }
}
