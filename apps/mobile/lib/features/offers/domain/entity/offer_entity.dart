class OfferEntity {
  OfferEntity({
    required this.id,
    required this.title,
    required this.description,
    required this.budget,
    required this.deadline,
    required this.status,
    required this.location,
    required this.idCompany,
    this.company,
  });

  final String id;
  final String title;
  final String description;
  final double budget;
  final DateTime deadline;
  final String status;
  final String location;
  final String idCompany;
  final CompanyEntity? company;
}

class CompanyEntity {
  CompanyEntity({
    required this.id,
    required this.companyName,
    this.industrySector,
    required this.companySize,
    required this.description,
    this.logoUrl,
    required this.idUser,
    this.user,
  });

  final String id;
  final String companyName;
  final String? industrySector;
  final int companySize;
  final String description;
  final String? logoUrl;
  final String idUser;
  final UserEntity? user;
}

class UserEntity {
  UserEntity({
    required this.id,
    required this.email,
    required this.role,
  });


  final String id;
  final String email;
  final String role;
}
