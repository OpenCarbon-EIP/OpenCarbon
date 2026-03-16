/*
*  login_response_model.dart
*
*  This file defines the data models for handling the login response from the API.
*/
class LoginResponseModel {
  LoginResponseModel({
    required this.success,
    this.data,
    required this.message,
    this.error,
    this.statusCode,
  });

  factory LoginResponseModel.fromJson(Map<String, dynamic> json) =>
      LoginResponseModel(
        success: json['success'] as bool,
        data: json['data'] != null
            ? LoginResponseData.fromJson(json['data'] as Map<String, dynamic>)
            : null,
        message: json['message'] as String,
        error: json['error'] as String?,
        statusCode: json['statusCode'] as int?,
      );

  final bool success;
  final LoginResponseData? data;
  final String message;
  final String? error;
  final int? statusCode;
}

class LoginResponseData {
  LoginResponseData({required this.accessToken, required this.user});

  factory LoginResponseData.fromJson(Map<String, dynamic> json) =>
      LoginResponseData(
        accessToken: json['access_token'] as String,
        user: LoginUser.fromJson(json['user'] as Map<String, dynamic>),
      );

  final String accessToken;
  final LoginUser user;
}

class LoginUser {
  LoginUser({
    required this.id,
    required this.email,
    required this.role,
  });

  factory LoginUser.fromJson(Map<String, dynamic> json) => LoginUser(
    id: json['id'] as String,
    email: json['email'] as String,
    role: json['role'] as String,
  );

  final String id;
  final String email;
  final String role;

}
