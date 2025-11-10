export interface TagsState {
    usedTags: string[];
}
export declare const addUsedTag: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "tags/addUsedTag">, addUsedTags: import("@reduxjs/toolkit").ActionCreatorWithPayload<string[], "tags/addUsedTags">, clearUnusedTags: import("@reduxjs/toolkit").ActionCreatorWithPayload<string[], "tags/clearUnusedTags">, setUsedTags: import("@reduxjs/toolkit").ActionCreatorWithPayload<string[], "tags/setUsedTags">;
export declare const selectAllUsedTags: (state: {
    tags: TagsState;
}) => string[];
export declare const selectAllTags: (state: {
    tags: TagsState;
}) => string[];
export declare const selectTagSuggestions: (query: string) => (state: {
    tags: TagsState;
}) => string[];
declare const _default: import("redux").Reducer<TagsState>;
export default _default;
