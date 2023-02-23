import { encryptWithLit, newLitKey } from "@/sdk/encryptionAndDecryption";
import { decryptFile, decryptPost as _decryptPost } from "@/sdk/folder";
import {
  createPrivatePostStream,
  createPublicPostStream,
  generateAccessControlConditions,
  loadMyPostStreamsByModel,
} from "@/sdk/stream";
import { CustomMirrorFile, LitKit } from "@/types";
import { getAddressFromDid } from "@/utils/didAndAddress";
import {
  DecryptionConditionsTypes,
  IndexFileContentType,
  MirrorFile,
  StreamObject,
} from "@dataverse/runtime-connector";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface Props {
  isEncrypting?: boolean;
  encryptedContent?: string;
  isEncryptedSuccessfully?: boolean;
  litKit?: LitKit;
  isPublishingPost: boolean;
  postList: StreamObject[];
}

const initialState: Props = {
  isEncrypting: false,
  encryptedContent: "",
  isEncryptedSuccessfully: false,
  litKit: undefined,
  isPublishingPost: false,
  postList: [],
};

export const encryptPost = createAsyncThunk(
  "post/encryptPost",
  async ({ did, content }: { did: string; content: string }) => {
    const address = getAddressFromDid(did);

    const decryptionConditions = await generateAccessControlConditions({
      did,
      address,
    });

    const decryptionConditionsType =
      DecryptionConditionsTypes.AccessControlCondition;

    const litKit = await newLitKey({
      did,
      decryptionConditions,
      decryptionConditionsType,
    });

    const res = await encryptWithLit({
      did,
      contentToBeEncrypted: content,
      litKit,
    });

    return res;
  }
);

export const decryptPost = createAsyncThunk(
  "post/decryptPost",
  async ({
    did,
    mirrorFile,
  }: {
    did: string;
    mirrorFile: CustomMirrorFile;
  }) => {
    if (!(mirrorFile.contentType in IndexFileContentType)) {
      const res = await _decryptPost({
        did,
        mirrorFile,
      });
      return res;
    }
    const res = await decryptFile({
      did,
      mirrorFile,
    });
    return res;
  }
);

export const publishPost = createAsyncThunk(
  "post/publishPost",
  async ({
    did,
    content,
    encryptedContent,
    litKit,
  }: {
    did: string;
    content: string;
    encryptedContent?: string;
    litKit?: LitKit;
  }) => {
    let res;
    if (!litKit) {
      res = await createPublicPostStream({ did, content });
    } else {
      res = await createPrivatePostStream({
        did,
        encryptedContent: encryptedContent!,
        litKit,
      });
    }
    return res;
  }
);

export const displayPostList = createAsyncThunk(
  "post/displayPostList",
  async (did: string) => {
    const res = await loadMyPostStreamsByModel(did);
    return res;
  }
);

export const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    setIsPublishingPost: (state, action: PayloadAction<boolean>) => {
      state.isPublishingPost = action.payload;
    },
    clearEncryptedState: (state) => {
      state.encryptedContent = "";
      state.isEncryptedSuccessfully = false;
      state.litKit = undefined;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(encryptPost.pending, (state) => {
      state.isEncrypting = true;
      state.isEncryptedSuccessfully = false;
    });
    builder.addCase(encryptPost.fulfilled, (state, action) => {
      state.encryptedContent = action.payload.encryptedContent;
      state.litKit = action.payload.litKit;
      state.isEncrypting = false;
      state.isEncryptedSuccessfully = true;
    });
    builder.addCase(encryptPost.rejected, (state) => {
      state.isEncrypting = false;
      state.isEncryptedSuccessfully = false;
    });

    builder.addCase(publishPost.pending, (state) => {
      state.isPublishingPost = true;
    });
    builder.addCase(publishPost.fulfilled, (state, action) => {
      state.postList.push(action.payload);
      state.isPublishingPost = false;
    });
    builder.addCase(publishPost.rejected, (state) => {
      state.isPublishingPost = false;
    });

    builder.addCase(displayPostList.fulfilled, (state, action) => {
      state.postList = action.payload;
    });
  },
});

export default postSlice.reducer;
