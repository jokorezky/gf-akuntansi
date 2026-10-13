"""Generator types NestJS dari daftar FIELDS di service (regex) — generik.

Usage: python gen_types.py <service.ts> <types.ts> <ClassName> <PageName>
"""
import re
import sys


def main():
    svc_path, dst_path, cls, page = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
    svc = open(svc_path, encoding="utf-8").read()
    pairs = re.findall(r'\{ t: "(\w+)", sql: "(\w+)", kind: "(\w)" \}', svc)
    out = ["  @Field(() => Int, { nullable: true }) id?: number;"]
    for t, _sql, k in pairs:
        if k == "b":
            out.append(f"  @Field(() => Boolean, {{ nullable: true }}) {t}?: boolean;")
        elif k in ("n",):
            out.append(f"  @Field(() => Int, {{ nullable: true }}) {t}?: number;")
        else:
            out.append(f"  @Field(() => String, {{ nullable: true }}) {t}?: string;")
    body = "\n".join(out)
    content = (
        'import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";\n\n'
        f"@ObjectType()\nexport class {cls} {{\n{body}\n}}\n\n"
        f"@InputType()\nexport class {cls}Input {{\n{body}\n}}\n\n"
        f"@ObjectType()\nexport class {page} {{\n"
        f"  @Field(() => [{cls}]) rows: {cls}[];\n  @Field(() => Int) total: number;\n}}\n"
    )
    open(dst_path, "w", encoding="utf-8").write(content)
    print("regen OK:", len(pairs), "fields ->", dst_path)


if __name__ == "__main__":
    main()
