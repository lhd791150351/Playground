import { readMyDefaultFolder } from "@/sdk/folder";
import { CustomFolder, CustomMirror } from "@/types";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { decryptPost } from "../post/slice";
import { decryptPost as _decryptPost } from "@/sdk/folder";
import { buyFile, monetizeFile } from "../file/slice";

interface Props {
  folder?: CustomFolder;
  currentMirror?: CustomMirror;
}

const initialState: Props = {
  folder: undefined,
  currentMirror: undefined,
};

export const displayDefaultFolder = createAsyncThunk(
  "folder/readMyDefaultFolder",
  async (did: string) => {
    const res = await readMyDefaultFolder(did);
    return res;
  }
);

export const folderSlice = createSlice({
  name: "folder",
  initialState,
  reducers: {
    setCurrentMirror: (
      state,
      action: PayloadAction<CustomMirror | undefined>
    ) => {
      state.currentMirror = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(displayDefaultFolder.fulfilled, (state, action) => {
      state.folder = action.payload as CustomFolder;
    });

    //decryptPostListener
    builder.addCase(decryptPost.pending, (state, action) => {
      state.folder?.mirrors.find((mirror) => {
        if (mirror.mirrorId === action.meta.arg.mirrorFile.indexFileId) {
          mirror.mirrorFile = {
            ...action.meta.arg.mirrorFile,
            isDecrypting: true,
          };
        }
      });
    });
    builder.addCase(decryptPost.fulfilled, (state, action) => {
      state.folder?.mirrors.find((mirror) => {
        if (mirror.mirrorId === action.payload.indexFileId) {
          mirror.mirrorFile = {
            ...action.payload,
            isDecrypting: false,
            isDecryptedSuccessfully: true,
          };
        }
      });
    });
    builder.addCase(decryptPost.rejected, (state, action) => {
      state.folder?.mirrors.find((mirror) => {
        if (mirror.mirrorId === action.meta.arg.mirrorFile.indexFileId) {
          mirror.mirrorFile = {
            ...action.meta.arg.mirrorFile,
            isDecrypting: false,
            isDecryptedSuccessfully: false,
          };
        }
      });
      alert(action.error.message);
    });

    //monetizeFileListener
    builder.addCase(monetizeFile.pending, (state, action) => {
      state.folder?.mirrors.find((mirror) => {
        if (mirror.mirrorId === action.meta.arg.mirrorFile.indexFileId) {
          mirror.mirrorFile = {
            ...action.meta.arg.mirrorFile,
            isMonetizing: true,
          };
        }
      });
    });
    builder.addCase(monetizeFile.fulfilled, (state, action) => {
      console.log({ payload: action.payload });
      state.folder?.mirrors.find((mirror) => {
        if (mirror.mirrorId === action.payload?.indexFileId) {
          mirror.mirrorFile = {
            ...action.payload,
            isMonetizing: false,
            isMonetizedSuccessfully: true,
          };
        }
      });
    });
    builder.addCase(monetizeFile.rejected, (state, action) => {
      state.folder?.mirrors.find((mirror) => {
        if (mirror.mirrorId === action.meta.arg.mirrorFile.indexFileId) {
          mirror.mirrorFile = {
            ...action.meta.arg.mirrorFile,
            isMonetizing: false,
            isMonetizedSuccessfully: false,
          };
        }
      });
      alert(action.error.message);
    });

    //buyFileListener
    builder.addCase(buyFile.pending, (state, action) => {
      state.folder?.mirrors.find((mirror) => {
        if (mirror.mirrorId === action.meta.arg.mirrorFile.indexFileId) {
          mirror.mirrorFile = {
            ...action.meta.arg.mirrorFile,
            isBuying: true,
          };
        }
      });
    });
    builder.addCase(buyFile.fulfilled, (state, action) => {
      state.folder?.mirrors.find((mirror) => {
        if (mirror.mirrorId === action.meta.arg.mirrorFile.indexFileId) {
          mirror.mirrorFile = {
            ...action.payload,
            isBuying: false,
            isBoughtSuccessfully: true,
          };
        }
      });
    });
    builder.addCase(buyFile.rejected, (state, action) => {
      state.folder?.mirrors.find((mirror) => {
        if (mirror.mirrorId === action.meta.arg.mirrorFile.indexFileId) {
          mirror.mirrorFile = {
            ...action.meta.arg.mirrorFile,
            isBuying: false,
            isBoughtSuccessfully: false,
          };
        }
      });
      alert(action.error.message);
    });
  },
});

export default folderSlice.reducer;
