import re

SRC = r"D:\Projects\gf-akuntansi-clone\apps\api\src\modules\master-data\vendor\vendor.service.ts"
DST = r"D:\Projects\gf-akuntansi-clone\apps\api\src\modules\master-data\vendor\vendor.types.ts"


def main():
    svc = open(SRC, encoding="utf-8").read()
    pairs = re.findall(r'\{ t: "(\w+)", sql: "(\w+)", kind: "(\w)" \}', svc)
    out = ["  @Field(() => Int, { nullable: true }) id?: number;"]
    for t, _sql, k in pairs:
        if k == "b":
            out.append(f"  @Field(() => Boolean, {{ nullable: true }}) {t}?: boolean;")
        elif k == "n":
            out.append(f"  @Field(() => Int, {{ nullable: true }}) {t}?: number;")
        else:
            out.append(f"  @Field(() => String, {{ nullable: true }}) {t}?: string;")
    body = "\n".join(out)
    content = (
        'import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";\n\n'
        "@ObjectType()\nexport class Vendor {\n" + body + "\n}\n\n"
        "@InputType()\nexport class VendorInput {\n" + body + "\n}\n\n"
        "@ObjectType()\nexport class VendorPage {\n"
        "  @Field(() => [Vendor]) rows: Vendor[];\n  @Field(() => Int) total: number;\n}\n"
    )
    open(DST, "w", encoding="utf-8").write(content)
    print("regen OK,", len(pairs), "fields")


if __name__ == "__main__":
    main()
