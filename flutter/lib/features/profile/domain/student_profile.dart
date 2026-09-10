class StudentProfile {
  const StudentProfile({
    required this.name,
    required this.language,
    required this.cefr,
    required this.dailyGoalMinutes,
    this.photoUrl,
  });
  final String name;
  final String language;
  final String cefr;
  final int dailyGoalMinutes;
  final String? photoUrl;
  factory StudentProfile.fromMap(Map<String, dynamic> data) => StudentProfile(
    name: (data['displayName'] ?? data['name'] ?? 'Aluno').toString(),
    language: (data['targetLanguage'] ?? data['language'] ?? 'Inglês')
        .toString(),
    cefr: (data['currentCefr'] ?? data['cefrLevel'] ?? 'A1').toString(),
    dailyGoalMinutes: (data['dailyGoalMinutes'] as num?)?.toInt() ?? 15,
    photoUrl: data['photoURL'] as String?,
  );
}
