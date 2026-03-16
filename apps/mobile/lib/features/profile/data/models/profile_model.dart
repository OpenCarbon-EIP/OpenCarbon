class ProfileModel {
  ProfileModel({this.success, this.data, required this.message, this.statusCode});

  factory ProfileModel.fromJson(Map<String, dynamic> json) => ProfileModel(
    success: json['success'] as bool?,
    data: json['data'] != null ? ProfileDataModel.fromJson(json['data'] as Map<String, dynamic>) : null,
    message: json['message'] as String,
    statusCode: json['statusCode'] as int?,
  );

  final bool? success;
  final ProfileDataModel? data;
  final String message;
  final int? statusCode;
}

class ProfileDataModel {
  ProfileDataModel({required this.id, required this.email, required this.role, this.consultantData, this.companyData});

  factory ProfileDataModel.fromJson(Map<String, dynamic> json) => ProfileDataModel(
    id: json['id'] as String,
    email: json['email'] as String,
    role: json['role'] as String,
    consultantData: json['consultant'] != null
        ? ConsultantDataModel.fromJson(json['consultant'] as Map<String, dynamic>)
        : null,
    companyData: json['company'] != null ? CompanyDataModel.fromJson(json['company'] as Map<String, dynamic>) : null,
  );

  final String id;
  final String email;
  final String role;
  final ConsultantDataModel? consultantData;
  final CompanyDataModel? companyData;
}

class ConsultantDataModel {
  ConsultantDataModel({
    required this.firstName,
    required this.lastName,
    required this.professionalTitle,
    this.description,
    this.photoUrl,
    required this.ratingScore,
    required this.isVerified,
  });

  factory ConsultantDataModel.fromJson(Map<String, dynamic> json) => ConsultantDataModel(
    firstName: json['first_name'] as String,
    lastName: json['last_name'] as String,
    professionalTitle: json['professional_title'] as String,
    description: json['description'] as String?,
    photoUrl: json['photo_url'] as String?,
    ratingScore: json['rating_score'] as int,
    isVerified: json['is_verified'] as bool,
  );

  final String firstName;
  final String lastName;
  final String professionalTitle;
  final String? description;
  final String? photoUrl;
  final int ratingScore;
  final bool isVerified;
}

class CompanyDataModel {
  CompanyDataModel({
    required this.companyName,
    required this.industrySector,
    required this.companySize,
    required this.description,
    this.logoUrl,
  });

  factory CompanyDataModel.fromJson(Map<String, dynamic> json) => CompanyDataModel(
    companyName: json['company_name'] as String,
    industrySector: json['industry_sector'] as String?,
    companySize: json['company_size'] as int,
    description: json['description'] as String,
    logoUrl: json['logo_url'] as String?,
  );

  final String companyName;
  final String? industrySector;
  final int companySize;
  final String description;
  final String? logoUrl;
}
