import { User, UserPreferences } from '../../types';
export interface UserState {
    user: User | null;
    loading: boolean;
    error: string | null;
}
export declare const setUser: import("@reduxjs/toolkit").ActionCreatorWithPayload<User, "user/setUser">, updateUser: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<User>, "user/updateUser">, updatePreferences: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<UserPreferences>, "user/updatePreferences">, clearUser: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"user/clearUser">, setUserLoading: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "user/setLoading">, setUserError: import("@reduxjs/toolkit").ActionCreatorWithPayload<string | null, "user/setError">;
export declare const selectUser: (state: {
    user: UserState;
}) => User | null;
export declare const selectUserPreferences: (state: {
    user: UserState;
}) => UserPreferences;
export declare const selectUserLoading: (state: {
    user: UserState;
}) => boolean;
export declare const selectUserError: (state: {
    user: UserState;
}) => string | null;
declare const _default: import("redux").Reducer<UserState>;
export default _default;
//# sourceMappingURL=userSlice.d.ts.map