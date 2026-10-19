import 'package:flutter_test/flutter_test.dart';
import 'package:euro_cars/main.dart';

void main() {
  testWidgets('EURO CARS app title renders', (tester) async {
    await tester.pumpWidget(const EuroApp());
    expect(find.text('EURO CARS'), findsOneWidget);
  });
}
