class Profile {
  Profile({required this.id, required this.email, required this.role, this.consultantData, this.companyData});

  final String id;
  final String email;
  final String role;
  final ConsultantData? consultantData;
  final CompanyData? companyData;
}

class ConsultantData {
  ConsultantData({
    required this.firstName,
    required this.lastName,
    required this.professionalTitle,
    this.description,
    this.photoUrl,
    required this.ratingScore,
    required this.isVerified,
  });

  final String firstName;
  final String lastName;
  final String professionalTitle;
  final String? description;
  final String? photoUrl;
  final int ratingScore;
  final bool isVerified;
}

class CompanyData {
  CompanyData({
    required this.companyName,
    required this.industrySector,
    required this.companySize,
    required this.description,
    this.logoUrl,
  });

  final String companyName;
  final String industrySector;
  final int companySize;
  final String description;
  final String? logoUrl;
}
