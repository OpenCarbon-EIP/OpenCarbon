class RegisterResponseModel {
  RegisterResponseModel({
    required this.success,
    this.data,
    required this.message,
    this.error,
    this.statusCode,
  });

  factory RegisterResponseModel.fromJson(Map<String, dynamic> json) =>
      RegisterResponseModel(
        success: json['success'] as bool,
        data: json['data'] != null
            ? RegisterResponseData.fromJson(json['data'] as Map<String, dynamic>)
            : null,
        message: json['message'] as String,
        error: json['error'] as String?,
        statusCode: json['statusCode'] as int?,
      );

  final bool success;
  final RegisterResponseData? data;
  final String message;
  final String? error;
  final int? statusCode;
}

class RegisterResponseData {
  RegisterResponseData({required this.accessToken, required this.user});

  factory RegisterResponseData.fromJson(Map<String, dynamic> json) =>
      RegisterResponseData(
        accessToken: json['access_token'] as String,
        user: RegisterUser.fromJson(json['user'] as Map<String, dynamic>),
      );

  final String accessToken;
  final RegisterUser user;
}

class RegisterUser {
  RegisterUser({
    required this.id,
    required this.email,
    required this.role,
  });

  factory RegisterUser.fromJson(Map<String, dynamic> json) => RegisterUser(
    id: json['id'] as String,
    email: json['email'] as String,
    role: json['role'] as String,
  );

  final String id;
  final String email;
  final String role;

}
