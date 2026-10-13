import { Scalar, CustomScalar } from "@nestjs/graphql";
import { Kind, ValueNode } from "graphql";

/** Exact decimal (uang/jumlah) — dikirim sebagai string, bukan float JS. */
@Scalar("Decimal", () => String)
export class DecimalScalar implements CustomScalar<string, string | null> {
  description = "Nilai desimal eksak (numeric), dikirim sebagai string.";

  parseValue(value: unknown): string {
    return String(value);
  }

  serialize(value: unknown): string | null {
    return value === null || value === undefined ? null : String(value);
  }

  parseLiteral(ast: ValueNode): string | null {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT || ast.kind === Kind.FLOAT) {
      return ast.value;
    }
    return null;
  }
}
