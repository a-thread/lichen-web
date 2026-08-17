import { Routes } from "@angular/router";
import { authGuard } from "./data-access/auth/auth.guard";

export const routes: Routes = [
  {
    path: "login",
    loadComponent: () =>
      import("./auth/login/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "signup",
    loadComponent: () =>
      import("./auth/create-account/create-account.component").then(
        (m) => m.CreateAccountComponent,
      ),
  },
  {
    path: "forgot-password",
    loadComponent: () =>
      import("./auth/forgot-password/forgot-password.component").then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: "reset-password",
    loadComponent: () =>
      import("./auth/reset-password/reset-password.component").then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: "",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./notes-list/notes-list.component").then(
        (m) => m.NotesListComponent,
      ),
  },
  {
    path: "note/new",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./note-editor/note-editor.component").then(
        (m) => m.NoteEditorComponent,
      ),
  },
  {
    path: "note/:id",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./note-editor/note-editor.component").then(
        (m) => m.NoteEditorComponent,
      ),
  },
  {
    path: "about",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./about/about.component").then((m) => m.AboutComponent),
  },
];
